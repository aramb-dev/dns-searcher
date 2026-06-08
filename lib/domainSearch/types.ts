export const domainProviders = ["cloudflare", "namecheap", "vercel"] as const

export type DomainProvider = (typeof domainProviders)[number]

export const domainStatuses = [
  "available",
  "unavailable",
  "premium",
  "unsupported",
  "unknown",
  "error",
] as const

export type DomainStatus = (typeof domainStatuses)[number]

export type DomainPrice = {
  currency?: string
  registration?: number
  renewal?: number
  transfer?: number
}

export type DomainCheckResult = {
  domain: string
  provider: DomainProvider
  status: DomainStatus
  registrable: boolean
  premium?: boolean
  price?: DomainPrice
  reason?: string
  raw?: unknown
  checkedAt: string
}

export type AggregatedDomainResult = {
  domain: string
  availability: Exclude<DomainStatus, "error">
  bestProvider?: DomainProvider
  cheapestRegistration?: DomainPrice & { provider: DomainProvider }
  cheapestRenewal?: DomainPrice & { provider: DomainProvider }
  premium: boolean
  providerResults: DomainCheckResult[]
  checkedAt: string
}

export type DomainSearchRequest = {
  query: string
  tlds?: string[]
  providers?: DomainProvider[]
}

export type DomainSearchResponse = {
  query: string
  candidates: string[]
  results: AggregatedDomainResult[]
  checkedAt: string
}

export interface DomainSearchProvider {
  name: DomainProvider
  check(domains: string[]): Promise<DomainCheckResult[]>
}
