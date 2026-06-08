import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple in-memory token bucket / sliding window rate limiter fallback.
// If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set,
// the proxy automatically routes rate limits to Upstash Redis.
const rateLimitMap = new Map<string, number[]>()

const LIMIT = 10 // Max requests per window
const WINDOW_MS = 60 * 1000 // 1 minute window (60 seconds)

export async function proxy(request: NextRequest) {
  // Inspect request body to check if Namecheap is selected.
  // We only rate-limit searches that include Namecheap because Namecheap calls
  // route through our rate-limited proxy. Cloudflare & Vercel searches are unmetered.
  if (request.method === "POST") {
    try {
      const clonedRequest = request.clone()
      const body = await clonedRequest.json()
      const providers = body?.providers as string[] | undefined

      // If providers array is specified and does NOT contain "namecheap", skip rate limiting.
      if (providers && !providers.includes("namecheap")) {
        return NextResponse.next()
      }
    } catch (error) {
      console.warn("[proxy] Failed to parse request body for Namecheap filtering, applying fallback rate-limit:", error)
    }
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] 
    || request.headers.get("x-real-ip") 
    || "127.0.0.1"
  const now = Date.now()

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  // Centralized Upstash Redis rate limiter (if config is provided)
  if (redisUrl && redisToken) {
    try {
      const key = `ratelimit:${ip}`
      const response = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["TTL", key]
        ]),
      })

      if (response.ok) {
        const payload = (await response.json()) as Array<{ result?: number; error?: string }>
        const currentCount = payload[0]?.result ?? 0
        const ttl = payload[1]?.result ?? -1

        // If the key is new (TTL is -1), set the expiration to 60 seconds
        if (ttl === -1) {
          await fetch(`${redisUrl}/expire/${key}/60`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${redisToken}`,
            },
          })
        }

        if (currentCount > LIMIT) {
          const resetTimeSec = ttl > 0 ? ttl : 60
          return new NextResponse(
            JSON.stringify({
              error: "Too many requests. Please slow down and try again later.",
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": resetTimeSec.toString(),
              },
            }
          )
        }
        
        return NextResponse.next()
      }
    } catch (error) {
      console.warn("[proxy] Upstash Redis rate limiting failed, falling back to memory:", error)
    }
  }

  // Fallback to in-memory sliding window rate limiter
  const timestamps = rateLimitMap.get(ip) || []
  const activeTimestamps = timestamps.filter((time) => now - time < WINDOW_MS)

  if (activeTimestamps.length >= LIMIT) {
    const oldestTimestamp = activeTimestamps[0]
    const resetTimeSec = Math.ceil((WINDOW_MS - (now - oldestTimestamp)) / 1000)

    return new NextResponse(
      JSON.stringify({
        error: "Too many requests. Please slow down and try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": resetTimeSec.toString(),
        },
      }
    )
  }

  activeTimestamps.push(now)
  rateLimitMap.set(ip, activeTimestamps)

  return NextResponse.next()
}

export const config = {
  matcher: "/api/domains/search",
}
