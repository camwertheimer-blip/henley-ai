import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";

// ---- Vercel KV Rate Limiting ----
// Helper: Check and increment rate limit counter for a given key
async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const count = await kv.incr(key);
    if (count === 1) {
      // First request in this window, set expiry
      await kv.expire(key, windowSeconds);
    }
    return count <= limit;
  } catch {
    // If KV fails, allow the request (fail open)
    return true;
  }
}

// /api/analyze: expensive Claude calls. 5 per hour per IP.
export async function checkAnalyzeLimiter(clientIp: string): Promise<boolean> {
  return checkRateLimit(`rl:analyze:${clientIp}`, 5, 3600);
}

// /api/contact: cheap form submission. 10 per hour per IP.
export async function checkContactLimiter(clientIp: string): Promise<boolean> {
  return checkRateLimit(`rl:contact:${clientIp}`, 10, 3600);
}

// /api/log-submission: same intake form, slightly more permissive. 10 per hour.
export async function checkLogSubmissionLimiter(clientIp: string): Promise<boolean> {
  return checkRateLimit(`rl:log-submission:${clientIp}`, 10, 3600);
}
// ---- Get client IP from request headers ----
// Vercel sets x-forwarded-for; we take the first IP (the real client).
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

// ---- Turnstile verification ----
// Verifies the token from the client against Cloudflare. Returns true if valid.
export async function verifyTurnstile(token: string | null | undefined, clientIp: string): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set");
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);
    formData.append("remoteip", clientIp);

    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = (await result.json()) as { success: boolean; "error-codes"?: string[] };
    if (!data.success) {
      console.error("Turnstile verification failed:", data["error-codes"]);
    }
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}