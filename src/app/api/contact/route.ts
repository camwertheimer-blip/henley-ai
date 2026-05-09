import { NextRequest } from "next/server";
import { contactLimiter, getClientIp, verifyTurnstile } from "@/lib/security";
import { sendSubmissionNotification } from "@/lib/email";

export const maxDuration = 30;

/* ─── Google service-account JWT (mirrors log-submission/route.ts) ─── */
async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
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

export async function POST(request: NextRequest) {
  try {
    // ---- Security: rate limit + Turnstile verification ----
    const clientIp = getClientIp(request);

    const { success: rateLimitOk } = await contactLimiter.limit(clientIp);
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const turnstileToken = body?.turnstileToken;
    const turnstileOk = await verifyTurnstile(turnstileToken, clientIp);
    if (!turnstileOk) {
      return new Response(
        JSON.stringify({ error: "Bot verification failed. Please refresh and try again." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    // ---- End security ----
    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim();
    const message = (body.message || "").toString().trim();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required." }),
        { status: 400 }
      );
    }

    // Always log to server console so Vercel captures it even if Sheets fails
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    console.log("CONTACT FORM: submission received");

    // Best-effort: write a row to a "Contact" tab in the same Google Sheet
    const svcEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (svcEmail && privateKey && sheetId) {
      try {
        const token = await getAccessToken(svcEmail, privateKey);
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Contact!A:D:append?valueInputOption=RAW`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              values: [[timestamp, name, email, message]],
            }),
          }
        );
      } catch (sheetErr) {
        console.error("Sheet write failed (non-fatal):", sheetErr);
      }
    }
// Email notification — fire-and-let-it-fail; helper swallows its own errors
await sendSubmissionNotification({
    type: "contact",
    name,
    email,
    message,
    sheetUrl: sheetId
      ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
      : undefined,
  });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error("contact error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to send message." }),
      { status: 500 }
    );
  }
}