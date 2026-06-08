import type {
  AggregatedDomainResult,
  DomainCheckResult,
  DomainProvider,
  DomainStatus,
} from "@/lib/domainSearch/types"

function getCheapestPrice(
  results: DomainCheckResult[],
  key: "registration" | "renewal",
) {
  return results.reduce<
    | {
        provider: DomainProvider
        currency?: string
        registration?: number
        renewal?: number
        transfer?: number
      }
    | undefined
  >((current, result) => {
    const value = result.price?.[key]

    if (typeof value !== "number") {
      return current
    }

    if (!current || value < (current[key] ?? Number.POSITIVE_INFINITY)) {
      return {
        provider: result.provider,
        ...result.price,
      }
    }

    return current
  }, undefined)
}

function deriveAvailability(results: DomainCheckResult[]): Exclude<DomainStatus, "error"> {
  if (results.some((result) => result.status === "available")) {
    return "available"
  }

  if (results.some((result) => result.status === "premium")) {
    return "premium"
  }

  if (
    results.length > 0 &&
    results.every((result) => result.status === "unsupported")
  ) {
    return "unsupported"
  }

  if (results.some((result) => result.status === "unavailable")) {
    return "unavailable"
  }

  return "unknown"
}

export function aggregateDomainResults(results: DomainCheckResult[]) {
  const grouped = new Map<string, DomainCheckResult[]>()

  for (const result of results) {
    const current = grouped.get(result.domain) ?? []
    current.push(result)
    grouped.set(result.domain, current)
  }

  return [...grouped.entries()]
    .map<AggregatedDomainResult>(([domain, providerResults]) => {
      const sortedProviderResults = [...providerResults].sort((left, right) =>
        left.provider.localeCompare(right.provider),
      )

      const cheapestRegistration = getCheapestPrice(
        sortedProviderResults,
        "registration",
      )
      const cheapestRenewal = getCheapestPrice(sortedProviderResults, "renewal")

      return {
        domain,
        availability: deriveAvailability(sortedProviderResults),
        bestProvider: cheapestRegistration?.provider,
        cheapestRegistration,
        cheapestRenewal,
        premium: sortedProviderResults.some(
          (result) => result.premium || result.status === "premium",
        ),
        providerResults: sortedProviderResults,
        checkedAt: sortedProviderResults
          .map((result) => result.checkedAt)
          .sort()
          .at(-1) ?? new Date().toISOString(),
      }
    })
    .sort((left, right) => left.domain.localeCompare(right.domain))
}
