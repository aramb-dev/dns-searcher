import { chunkDomains, createErrorResults, parsePrice, withTimeout } from "@/lib/domainSearch/providers/providerUtils"
import type {
  DomainCheckResult,
  DomainSearchProvider,
} from "@/lib/domainSearch/types"

const cloudflareApiBaseUrl = "https://api.cloudflare.com/client/v4"

type CloudflareAvailabilityResponse = {
  success: boolean
  errors?: Array<{ message?: string }>
  result?: Array<{
    name: string
    available: boolean
    supported_tld?: boolean
    can_register?: boolean
    premium?: boolean
    price?: {
      currency?: string
      register?: string
      renew?: string
      transfer?: string
    }
  }>
}

function getCloudflareEnv() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !apiToken) {
    return null
  }

  return { accountId, apiToken }
}

export function mapCloudflareResult(
  input: NonNullable<CloudflareAvailabilityResponse["result"]>[number],
): DomainCheckResult {
  const checkedAt = new Date().toISOString()
  const supported = input.supported_tld !== false
  const registrable = input.can_register ?? input.available
  const premium = Boolean(input.premium)

  return {
    domain: input.name,
    provider: "cloudflare",
    status: !supported
      ? "unsupported"
      : premium
        ? "premium"
        : registrable
          ? "available"
          : "unavailable",
    registrable,
    premium,
    price: {
      currency: input.price?.currency,
      registration: parsePrice(input.price?.register),
      renewal: parsePrice(input.price?.renew),
      transfer: parsePrice(input.price?.transfer),
    },
    checkedAt,
    raw: input,
  }
}

export const cloudflareProvider: DomainSearchProvider = {
  name: "cloudflare",
  async check(domains) {
    const credentials = getCloudflareEnv()

    if (!credentials) {
      return createErrorResults(
        "cloudflare",
        domains,
        "Missing Cloudflare credentials",
      )
    }

    const results: DomainCheckResult[] = []

    for (const batch of chunkDomains(domains, 20)) {
      try {
        const response = await withTimeout("cloudflare-check-timeout", (signal) =>
          fetch(
            `${cloudflareApiBaseUrl}/accounts/${credentials.accountId}/registrar/domains/check`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${credentials.apiToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ domains: batch }),
              signal,
            },
          ),
        )

        const payload = (await response.json()) as CloudflareAvailabilityResponse

        if (!response.ok || !payload.success || !payload.result) {
          const reason =
            payload.errors?.map((error) => error.message).filter(Boolean).join(", ") ||
            `Cloudflare request failed with ${response.status}`

          results.push(...createErrorResults("cloudflare", batch, reason))
          continue
        }

        results.push(...payload.result.map(mapCloudflareResult))
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Cloudflare request failed"

        results.push(...createErrorResults("cloudflare", batch, reason))
      }
    }

    return results
  },
}
