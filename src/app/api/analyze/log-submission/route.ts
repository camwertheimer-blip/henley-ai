import { NextRequest } from "next/server";

export const maxDuration = 60;

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const key = privateKey.replace(/\\n/g, "\n");
  const pemBody = key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const binaryKey = Buffer.from(pemBody, "base64");

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    Buffer.from(signingInput)
  );

  const jwt = `${signingInput}.${Buffer.from(signature).toString("base64url")}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function createGoogleDoc(title: string, content: string, token: string): Promise<string> {
  // Create the doc
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const doc = await createRes.json();
  const docId = doc.documentId;

  // Insert content
  await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{ insertText: { location: { index: 1 }, text: content } }],
    }),
  });

  return `https://docs.google.com/document/d/${docId}/edit`;
}

export async function POST(request: NextRequest) {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY!;
    const sheetId = process.env.GOOGLE_SHEET_ID!;

    if (!email || !privateKey || !sheetId) {
      return new Response(JSON.stringify({ error: "Missing Google credentials" }), { status: 500 });
    }

    const body = await request.json();
    const { formData, analysisOutput } = body;

    const token = await getAccessToken(email, privateKey);

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const name = formData.contactName || "";
    const emailAddr = formData.contactEmail || "";
    const phone = formData.contactPhone || "";

    // Build intake doc content
    const intakeContent = `HENLEY AI — CASE INTAKE\n${timestamp}\n\n` +
      `Name: ${name}\nEmail: ${emailAddr}\nPhone: ${phone}\n\n` +
      `CASE NARRATIVE:\n${formData.caseNarrative || ""}\n\n` +
      `JURISDICTION:\n${formData.jurisdiction || ""}\n\n` +
      `KEY DOCUMENTS & LEGAL BASIS:\n${formData.keyDocuments || ""}\n\n` +
      `DEFENDANT & ASSET PROFILE:\n${formData.defendantProfile || ""}\n\n` +
      `DAMAGES ESTIMATE:\n${formData.damagesEstimate || ""}\n\n` +
      `FUNDING REQUEST: $${formData.fundingRequest || ""}\n\n` +
      `REPRESENTATION: ${formData.representationStatus || ""}` +
      (formData.firmName ? `\nFirm: ${formData.firmName}` : "") +
      (formData.attorneyName ? `\nAttorney: ${formData.attorneyName}` : "") +
      (formData.feeStructure ? `\nFee Structure: ${formData.feeStructure}` : "") +
      `\n\nCOUNTERCLAIMS: ${formData.counterclaimsStatus || ""}` +
      (formData.counterclaimDescription ? `\nDetails: ${formData.counterclaimDescription}` : "");

    const outputContent = `HENLEY AI — UNDERWRITING REPORT\n${timestamp}\n\nSubmitted by: ${name} (${emailAddr})\n\n${analysisOutput || ""}`;

    const slug = name.replace(/\s+/g, "_") || "Unknown";
    const dateSlug = new Date().toISOString().slice(0, 10);

    const [intakeUrl, outputUrl] = await Promise.all([
      createGoogleDoc(`Henley_Intake_${slug}_${dateSlug}`, intakeContent, token),
      createGoogleDoc(`Henley_Output_${slug}_${dateSlug}`, outputContent, token),
    ]);

    // Append row to sheet
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          values: [[timestamp, name, emailAddr, phone, intakeUrl, outputUrl]],
        }),
      }
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error("log-submission error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Logging failed" }), { status: 500 });
  }
}