import { DomainSearchError, searchDomains } from "@/lib/domainSearch/searchDomains"
import type { DomainSearchRequest } from "@/lib/domainSearch/types"

type SearchExecutor = typeof searchDomains

export function createDomainSearchRoute(executeSearch: SearchExecutor = searchDomains) {
  return async function handleSearch(request: Request) {
    try {
      const body = (await request.json()) as DomainSearchRequest
      const result = await executeSearch(body)

      return Response.json(result)
    } catch (error) {
      if (error instanceof DomainSearchError) {
        return Response.json(
          { error: error.message },
          { status: error.statusCode },
        )
      }

      console.error("[domain-search] route failed", {
        error: error instanceof Error ? error.message : error,
      })

      return Response.json(
        { error: "Something went wrong while searching domains" },
        { status: 500 },
      )
    }
  }
}
