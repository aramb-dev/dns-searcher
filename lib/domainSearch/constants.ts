import type { DomainProvider } from "@/lib/domainSearch/types"

export const defaultTlds = [
  "com",
  "dev",
  "app",
  "ai",
  "io",
  "co",
  "net",
  "org",
] as const

export const defaultPrefixes = ["", "get", "use", "try", "go", "my"] as const

export const defaultProviders: DomainProvider[] = [
  "cloudflare",
  "namecheap",
  "vercel",
]

export const maxCandidates = 100
export const providerRequestTimeoutMs = 10_000
