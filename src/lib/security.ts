import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// ---- Upstash Redis client (auto-reads UPSTASH_REDIS_REST_URL + _TOKEN env vars) ----
const redis = Redis.fromEnv();

// ---- Rate limiters: different limits per endpoint ----
// Sliding window: limits actions per IP over a rolling time window.

// /api/analyze: expensive Claude calls. 5 per hour per IP.
export const analyzeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:analyze",
  analytics: true,
});

// /api/contact: cheap form submission. 10 per hour per IP.
export const contactLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:contact",
  analytics: true,
});

// /api/log-submission: same intake form, slightly more permissive. 10 per hour.
export const logSubmissionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:log-submission",
  analytics: true,
});

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