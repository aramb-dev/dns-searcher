import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple in-memory token bucket / sliding window rate limiter.
// In Next.js 16+, middleware is replaced by the 'proxy.ts' file convention.
const rateLimitMap = new Map<string, number[]>()

const LIMIT = 10 // Max requests per window
const WINDOW_MS = 60 * 1000 // 1 minute window

export function proxy(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] 
    || request.headers.get("x-real-ip") 
    || "127.0.0.1"
  const now = Date.now()

  const timestamps = rateLimitMap.get(ip) || []
  
  // Remove timestamps outside the sliding window
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

  // Record new request timestamp
  activeTimestamps.push(now)
  rateLimitMap.set(ip, activeTimestamps)

  return NextResponse.next()
}

export const config = {
  matcher: "/api/domains/search",
}
