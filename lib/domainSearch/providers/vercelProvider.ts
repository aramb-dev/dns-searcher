import { createErrorResults, parsePrice, withTimeout } from "@/lib/domainSearch/providers/providerUtils"
import type {
  DomainCheckResult,
  DomainSearchProvider,
} from "@/lib/domainSearch/types"

const vercelApiBaseUrl = "https://api.vercel.com/v4/domains"

type VercelAvailabilityResponse = {
  domains?: Array<{
    name: string
    available?: boolean
    recommended?: boolean
    price?: number
  }>
  error?: { message?: string }
}

type VercelPriceResponse = {
  price?: number
  renew?: number
  currency?: string
  error?: { message?: string }
}

type VercelTldsResponse = {
  tlds?: Array<{
    slug: string
  }>
}

let supportedTldsPromise: Promise<Set<string>> | undefined

function getVercelEnv() {
  const token = process.env.VERCEL_API_TOKEN

  if (!token) {
    return null
  }

  return {
    token,
    teamId: process.env.VERCEL_TEAM_ID,
  }
}

async function getSupportedTlds(token: string, teamId?: string) {
  if (!supportedTldsPromise) {
    supportedTldsPromise = withTimeout("vercel-tlds-timeout", async (signal) => {
      const url = new URL(`${vercelApiBaseUrl}/tlds`)

      if (teamId) {
        url.searchParams.set("teamId", teamId)
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      const payload = (await response.json()) as VercelTldsResponse

      return new Set(payload.tlds?.map((entry) => entry.slug.toLowerCase()) ?? [])
    })
  }

  return supportedTldsPromise
}

export function mapVercelResult(input: {
  domain: string
  available?: boolean
  supported: boolean
  registration?: number
  renewal?: number
}) {
  const checkedAt = new Date().toISOString()

  return {
    domain: input.domain,
    provider: "vercel",
    status: !input.supported
      ? "unsupported"
      : input.available
        ? "available"
        : "unavailable",
    registrable: Boolean(input.supported && input.available),
    price: {
      currency: "USD",
      registration: input.registration,
      renewal: input.renewal,
    },
    checkedAt,
    raw: input,
  } satisfies DomainCheckResult
}

export const vercelProvider: DomainSearchProvider = {
  name: "vercel",
  async check(domains) {
    const credentials = getVercelEnv()

    if (!credentials) {
      return createErrorResults("vercel", domains, "Missing Vercel credentials")
    }

    try {
      const supportedTlds = await getSupportedTlds(
        credentials.token,
        credentials.teamId,
      )
      const supportedDomains = domains.filter((domain) =>
        supportedTlds.has(domain.split(".").at(-1) ?? ""),
      )
      const unsupportedResults = domains
        .filter((domain) => !supportedDomains.includes(domain))
        .map((domain) =>
          mapVercelResult({
            domain,
            supported: false,
          }),
        )

      if (supportedDomains.length === 0) {
        return unsupportedResults
      }

      const availabilityUrl = new URL(`${vercelApiBaseUrl}/registrar/available`)

      if (credentials.teamId) {
        availabilityUrl.searchParams.set("teamId", credentials.teamId)
      }

      const availabilityResponse = await withTimeout(
        "vercel-availability-timeout",
        (signal) =>
          fetch(availabilityUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credentials.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ domains: supportedDomains }),
            signal,
          }),
      )
      const availabilityPayload =
        (await availabilityResponse.json()) as VercelAvailabilityResponse

      if (!availabilityResponse.ok || !availabilityPayload.domains) {
        const reason =
          availabilityPayload.error?.message ??
          `Vercel availability request failed with ${availabilityResponse.status}`

        return [
          ...createErrorResults("vercel", supportedDomains, reason),
          ...unsupportedResults,
        ]
      }

      const priceResults = await Promise.all(
        availabilityPayload.domains.map(async (entry) => {
          const priceUrl = new URL(
            `${vercelApiBaseUrl}/registrar/price`,
          )
          priceUrl.searchParams.set("name", entry.name)

          if (credentials.teamId) {
            priceUrl.searchParams.set("teamId", credentials.teamId)
          }

          try {
            const response = await withTimeout("vercel-price-timeout", (signal) =>
              fetch(priceUrl, {
                headers: { Authorization: `Bearer ${credentials.token}` },
                signal,
              }),
            )
            const payload = (await response.json()) as VercelPriceResponse

            return mapVercelResult({
              domain: entry.name,
              available: entry.available,
              supported: true,
              registration: parsePrice(payload.price ?? entry.price),
              renewal: parsePrice(payload.renew),
            })
          } catch {
            return mapVercelResult({
              domain: entry.name,
              available: entry.available,
              supported: true,
              registration: parsePrice(entry.price),
            })
          }
        }),
      )

      return [...priceResults, ...unsupportedResults]
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Vercel request failed"

      return createErrorResults("vercel", domains, reason)
    }
  },
}
