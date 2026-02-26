import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not set. Add it to your environment." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { narrative, documents } = body as {
      narrative: string;
      documents: { name: string; content: string; type: string }[];
    };

    // Read system prompt from project root and pass as system to Claude
    const projectRoot = process.cwd();
    const systemPromptPath = join(projectRoot, "system_prompt.txt");
    if (!existsSync(systemPromptPath)) {
      return NextResponse.json(
        { error: `system_prompt.txt not found at ${systemPromptPath}. Ensure it exists at the project root.` },
        { status: 500 }
      );
    }
    const systemPrompt = readFileSync(systemPromptPath, "utf-8");

    const contentBlocks: { type: string; text?: string; source?: { type: string; media_type: string; data: string } }[] = [];

    let userMessage = narrative?.trim() || "";
    if (documents?.length) {
      userMessage += "\n\n--- Uploaded documents ---\n\n";
      for (const doc of documents) {
        if (doc.type.startsWith("image/")) {
          contentBlocks.push({
            type: "image",
            source: {
              type: "base64",
              media_type: doc.type,
              data: doc.content,
            },
          });
          userMessage += `[Image: ${doc.name}]\n`;
        } else {
          userMessage += `Document: ${doc.name}\n${doc.content}\n\n`;
        }
      }
    }

    contentBlocks.unshift({ type: "text", text: userMessage || "No narrative provided." });

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 16000,
          system: systemPrompt,
          messages: [{ role: "user", content: contentBlocks }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Claude API error: ${response.status} - ${err}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text =
      data.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";

    return NextResponse.json({ response: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
