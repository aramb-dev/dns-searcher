import { aggregateDomainResults } from "@/lib/domainSearch/aggregateResults"
import {
  defaultProviders,
  defaultTlds,
  maxCandidates,
} from "@/lib/domainSearch/constants"
import {
  generateCandidates,
  normalizeDomainQuery,
  normalizeTld,
} from "@/lib/domainSearch/generateCandidates"
import { getProviders } from "@/lib/domainSearch/providers"
import { domainProviders } from "@/lib/domainSearch/types"
import type {
  DomainCheckResult,
  DomainProvider,
  DomainSearchRequest,
  DomainSearchResponse,
  DomainSearchProvider,
} from "@/lib/domainSearch/types"

type SearchDomainsOptions = {
  providers?: DomainSearchProvider[]
}

export class DomainSearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message)
    this.name = "DomainSearchError"
  }
}

export function parseRequestedProviders(providers?: string[]) {
  if (!providers || providers.length === 0) {
    return defaultProviders
  }

  const uniqueProviders = [...new Set(providers)]

  if (
    uniqueProviders.some(
      (provider): provider is string =>
        !domainProviders.includes(provider as DomainProvider),
    )
  ) {
    throw new DomainSearchError("One or more providers are not supported")
  }

  return uniqueProviders as DomainProvider[]
}

export function parseRequestedTlds(tlds?: string[]) {
  const normalized = (tlds && tlds.length > 0 ? tlds : [...defaultTlds])
    .map(normalizeTld)
    .filter(Boolean)

  if (normalized.length === 0) {
    throw new DomainSearchError("Select at least one TLD")
  }

  return [...new Set(normalized)]
}

export function validateSearchRequest(input: DomainSearchRequest) {
  const query = normalizeDomainQuery(input.query)

  if (query.length < 2) {
    throw new DomainSearchError("Enter at least two valid characters")
  }

  const tlds = parseRequestedTlds(input.tlds)
  const providers = parseRequestedProviders(input.providers)
  const candidates = generateCandidates(query, tlds)

  if (candidates.length === 0) {
    throw new DomainSearchError("No valid domain candidates were generated")
  }

  if (candidates.length > maxCandidates) {
    throw new DomainSearchError(
      `Too many candidates requested (${candidates.length}). Reduce your TLD list.`,
    )
  }

  return {
    query,
    tlds,
    providers,
    candidates,
  }
}

export async function searchDomains(
  input: DomainSearchRequest,
  options: SearchDomainsOptions = {},
): Promise<DomainSearchResponse> {
  const { query, providers, candidates } = validateSearchRequest(input)
  const providerInstances =
    options.providers ?? getProviders(providers)
  const checkedAt = new Date().toISOString()

  console.info("[domain-search] search started", {
    query,
    candidateCount: candidates.length,
    providers: providerInstances.map((provider) => provider.name),
  })

  const providerResults = await Promise.allSettled(
    providerInstances.map((provider) => provider.check(candidates)),
  )

  const normalizedResults = providerResults.flatMap<DomainCheckResult>(
    (result, index) => {
      if (result.status === "fulfilled") {
        return result.value
      }

      const providerName = providerInstances[index]?.name ?? "unknown"
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : "Provider request failed"

      console.error("[domain-search] provider failed", {
        provider: providerName,
        query,
        reason,
      })

      return candidates.map((domain) => ({
        domain,
        provider: providerName as DomainProvider,
        status: "error" as const,
        registrable: false,
        reason,
        checkedAt,
      }))
    },
  )

  return {
    query,
    candidates,
    results: aggregateDomainResults(normalizedResults),
    checkedAt,
  }
}
