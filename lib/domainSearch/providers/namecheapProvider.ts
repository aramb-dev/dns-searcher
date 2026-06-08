import { chunkDomains, createErrorResults, parsePrice, withTimeout } from "@/lib/domainSearch/providers/providerUtils"
import type {
  DomainCheckResult,
  DomainSearchProvider,
} from "@/lib/domainSearch/types"
import { ProxyAgent } from "undici"

function getFetchOptions(signal?: AbortSignal) {
  const options: RequestInit & { dispatcher?: any } = { signal }
  const proxyUrl = process.env.FIXIE_URL || process.env.HTTP_PROXY || process.env.HTTPS_PROXY
  if (proxyUrl) {
    options.dispatcher = new ProxyAgent(proxyUrl)
  }
  return options
}

const defaultNamecheapApiUrl = "https://api.namecheap.com/xml.response"

type NamecheapPricing = {
  registration?: number
  renewal?: number
  currency?: string
}

type ParsedNamecheapDomain = {
  domain: string
  available: boolean
  premium: boolean
  premiumRegistrationPrice?: number
  premiumRenewalPrice?: number
  error?: string
}

const namecheapPricingCache = new Map<string, NamecheapPricing>()

function getNamecheapEnv() {
  const apiKey = process.env.NAMECHEAP_API_KEY
  const apiUser = process.env.NAMECHEAP_API_USER
  const username = process.env.NAMECHEAP_USERNAME ?? apiUser
  const clientIp = process.env.NAMECHEAP_CLIENT_IP
  const apiBaseUrl = process.env.NAMECHEAP_API_BASE_URL ?? defaultNamecheapApiUrl

  if (!apiKey || !apiUser || !username || !clientIp) {
    return null
  }

  return { apiBaseUrl, apiKey, apiUser, username, clientIp }
}

function parseXmlAttributes(tag: string) {
  const attributes = new Map<string, string>()

  for (const match of tag.matchAll(/([A-Za-z0-9:_-]+)="([^"]*)"/g)) {
    attributes.set(match[1], match[2])
  }

  return attributes
}

export function parseNamecheapCheckResponse(xml: string) {
  const entries: ParsedNamecheapDomain[] = []

  for (const match of xml.matchAll(/<DomainCheckResult\b([^>]*)\/>/g)) {
    const attributes = parseXmlAttributes(match[1])
    const domain = attributes.get("Domain") ?? ""

    if (!domain) {
      continue
    }

    const available = attributes.get("Available") === "true"
    const premium = attributes.get("IsPremiumName") === "true"

    entries.push({
      domain: domain.toLowerCase(),
      available,
      premium,
      premiumRegistrationPrice: parsePrice(
        attributes.get("PremiumRegistrationPrice"),
      ),
      premiumRenewalPrice: parsePrice(attributes.get("PremiumRenewalPrice")),
      error: attributes.get("Description"),
    })
  }

  return entries
}

export function parseNamecheapPricingResponse(xml: string) {
  const prices = new Map<string, NamecheapPricing>()
  let currentTld = ""

  for (const line of xml.split("\n")) {
    const productMatch = line.match(/<Product\b([^>]*)>/)

    if (productMatch) {
      const attributes = parseXmlAttributes(productMatch[1])
      currentTld = (attributes.get("Name") ?? "").toLowerCase()
    }

    const priceMatch = line.match(/<Price\b([^>]*)\/>/)

    if (!priceMatch || !currentTld) {
      continue
    }

    const attributes = parseXmlAttributes(priceMatch[1])
    const existing = prices.get(currentTld) ?? {}
    const category = attributes.get("DurationType")
    const price = parsePrice(attributes.get("Price"))

    if (category === "REGISTER") {
      existing.registration = price
    }

    if (category === "RENEW") {
      existing.renewal = price
    }

    existing.currency = attributes.get("Currency")
    prices.set(currentTld, existing)
  }

  return prices
}

async function fetchNamecheapPricing(tlds: string[]) {
  const credentials = getNamecheapEnv()

  if (!credentials) {
    return new Map<string, NamecheapPricing>()
  }

  const missingTlds = [...new Set(tlds)].filter(
    (tld) => !namecheapPricingCache.has(tld),
  )

  if (missingTlds.length === 0) {
    return namecheapPricingCache
  }

  for (const tld of missingTlds) {
    try {
      const url = new URL(credentials.apiBaseUrl)
      url.search = new URLSearchParams({
        ApiUser: credentials.apiUser,
        ApiKey: credentials.apiKey,
        UserName: credentials.username,
        ClientIp: credentials.clientIp,
        Command: "namecheap.users.getPricing",
        ProductType: "DOMAIN",
        ProductCategory: "register,renew",
        ProductName: tld.toUpperCase(),
      }).toString()

      const response = await withTimeout("namecheap-pricing-timeout", (signal) =>
        fetch(url, getFetchOptions(signal)),
      )
      const xml = await response.text()
      const parsed = parseNamecheapPricingResponse(xml).get(tld)

      namecheapPricingCache.set(tld, parsed ?? {})
    } catch {
      namecheapPricingCache.set(tld, {})
    }
  }

  return namecheapPricingCache
}

export function mapNamecheapResult(
  input: ParsedNamecheapDomain,
  pricing?: NamecheapPricing,
): DomainCheckResult {
  const checkedAt = new Date().toISOString()
  const registrable = input.available || input.premium
  const status = input.premium
    ? "premium"
    : input.available
      ? "available"
      : "unavailable"

  return {
    domain: input.domain,
    provider: "namecheap",
    status,
    registrable,
    premium: input.premium,
    price: {
      currency: pricing?.currency ?? "USD",
      registration:
        input.premiumRegistrationPrice ?? pricing?.registration,
      renewal: input.premiumRenewalPrice ?? pricing?.renewal,
    },
    reason: input.error,
    checkedAt,
    raw: input,
  }
}

export const namecheapProvider: DomainSearchProvider = {
  name: "namecheap",
  async check(domains) {
    const credentials = getNamecheapEnv()

    if (!credentials) {
      return createErrorResults(
        "namecheap",
        domains,
        "Missing Namecheap credentials",
      )
    }

    const pricing = await fetchNamecheapPricing(
      domains.map((domain) => domain.split(".").at(-1) ?? ""),
    )
    const results: DomainCheckResult[] = []

    for (const batch of chunkDomains(domains, 50)) {
      try {
        const url = new URL(credentials.apiBaseUrl)
        url.search = new URLSearchParams({
          ApiUser: credentials.apiUser,
          ApiKey: credentials.apiKey,
          UserName: credentials.username,
          ClientIp: credentials.clientIp,
          Command: "namecheap.domains.check",
          DomainList: batch.join(","),
        }).toString()

        const response = await withTimeout("namecheap-check-timeout", (signal) =>
          fetch(url, getFetchOptions(signal)),
        )
        const xml = await response.text()
        const parsed = parseNamecheapCheckResponse(xml)

        if (parsed.length === 0) {
          results.push(
            ...createErrorResults(
              "namecheap",
              batch,
              `Namecheap request failed with ${response.status}`,
            ),
          )
          continue
        }

        results.push(
          ...parsed.map((entry) =>
            mapNamecheapResult(
              entry,
              pricing.get(entry.domain.split(".").at(-1) ?? ""),
            ),
          ),
        )
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Namecheap request failed"

        results.push(...createErrorResults("namecheap", batch, reason))
      }
    }

    return results
  },
}
