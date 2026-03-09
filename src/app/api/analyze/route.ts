import { NextRequest } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set. Add it to your environment." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const {
      caseNarrative,
      jurisdiction,
      keyDocuments,
      defendantProfile,
      damagesEstimate,
      fundingRequest,
      representationStatus,
      firmName,
      attorneyName,
      feeStructure,
      counterclaimsStatus,
      counterclaimDescription,
      contactName,
      contactEmail,
      contactPhone,
      attachments,
    } = body as {
      caseNarrative: string;
      jurisdiction: string;
      keyDocuments: string;
      defendantProfile: string;
      damagesEstimate: string;
      fundingRequest: string;
      representationStatus: string;
      firmName: string;
      attorneyName: string;
      feeStructure: string;
      counterclaimsStatus: "none" | "filed" | "threatened" | "unknown";
      counterclaimDescription: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      attachments?: { name: string; content: string; type: string }[];
    };

    // Read system prompt from project root
    const projectRoot = process.cwd();
    const systemPromptPath = join(projectRoot, "system_prompt.txt");
    if (!existsSync(systemPromptPath)) {
      return new Response(
        JSON.stringify({ error: `system_prompt.txt not found at ${systemPromptPath}.` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const systemPrompt = readFileSync(systemPromptPath, "utf-8");

    // Assemble representation status
    let repStatus = representationStatus || "Not specified";
    if (representationStatus === "represented") {
      repStatus = `Represented`;
      if (firmName) repStatus += `\n  Firm: ${firmName}`;
      if (attorneyName) repStatus += `\n  Lead Attorney: ${attorneyName}`;
      if (feeStructure) repStatus += `\n  Fee Structure: ${feeStructure}`;
    } else if (representationStatus === "seeking") {
      repStatus = "Seeking Representation";
    } else if (representationStatus === "preliminary") {
      repStatus = "Preliminary Only — exploring options";
    }

    // Assemble counterclaims field
    let counterclaimsField = "Not disclosed";
    if (counterclaimsStatus === "none") {
      counterclaimsField = "None filed or threatened";
    } else if (counterclaimsStatus === "filed") {
      counterclaimsField = `Filed${counterclaimDescription ? `\n  Details: ${counterclaimDescription}` : ""}`;
    } else if (counterclaimsStatus === "threatened") {
      counterclaimsField = `Threatened${counterclaimDescription ? `\n  Details: ${counterclaimDescription}` : ""}`;
    } else if (counterclaimsStatus === "unknown") {
      counterclaimsField = "Unknown — plaintiff has not confirmed counterclaim status";
    }

    let userMessage = `=== LITIGATION FUNDING APPLICATION ===

CASE NARRATIVE:
${caseNarrative || "Not provided"}

JURISDICTION:
${jurisdiction || "Not specified"}

KEY DOCUMENTS & LEGAL BASIS:
${keyDocuments || "Not provided"}

DEFENDANT & ASSET PROFILE:
${defendantProfile || "Not provided"}

DAMAGES ESTIMATE:
${damagesEstimate || "Not provided"}

FUNDING REQUEST (USD):
$${fundingRequest || "Not specified"}

LEGAL REPRESENTATION:
${repStatus}

COUNTERCLAIMS:
${counterclaimsField}

SUBMITTED BY:
${contactName || "Not provided"}${contactEmail ? `\nEmail: ${contactEmail}` : ""}${contactPhone ? `\nPhone: ${contactPhone}` : ""}`;

    // Build content blocks
    const contentBlocks: { type: string; text?: string; source?: { type: string; media_type: string; data: string } }[] = [];

    if (attachments?.length) {
      userMessage += "\n\n--- ATTACHED DOCUMENTS ---\n";
      for (const doc of attachments) {
        if (doc.type.startsWith("image/")) {
          contentBlocks.push({
            type: "image",
            source: { type: "base64", media_type: doc.type, data: doc.content },
          });
          userMessage += `\n[Image attachment: ${doc.name}]`;
        } else {
          userMessage += `\nDocument: ${doc.name}\n${doc.content}\n`;
        }
      }
    }

    contentBlocks.unshift({ type: "text", text: userMessage });

    // Call Anthropic with stream: true
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
          "anthropic-beta": "output-128k-2025-02-19",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 100000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: contentBlocks }],
      }),
    });

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text();
      return new Response(
        JSON.stringify({ error: `Claude API error: ${anthropicResponse.status} - ${err}` }),
        { status: anthropicResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pipe text tokens directly to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicResponse.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.type === "text_delta" &&
                  parsed.delta?.text
                ) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {
                // Skip malformed SSE lines
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}