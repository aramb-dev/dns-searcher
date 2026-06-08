import { describe, expect, test } from "bun:test"
import { aggregateDomainResults } from "@/lib/domainSearch/aggregateResults"
import { searchDomains, validateSearchRequest } from "@/lib/domainSearch/searchDomains"
import type { DomainSearchProvider } from "@/lib/domainSearch/types"

describe("searchDomains", () => {
  test("aggregates provider results and chooses the cheapest provider", () => {
    const aggregated = aggregateDomainResults([
      {
        domain: "jobticket.dev",
        provider: "cloudflare",
        status: "available",
        registrable: true,
        checkedAt: "2026-06-08T12:00:00.000Z",
        price: { currency: "USD", registration: 12, renewal: 14 },
      },
      {
        domain: "jobticket.dev",
        provider: "namecheap",
        status: "available",
        registrable: true,
        checkedAt: "2026-06-08T12:01:00.000Z",
        price: { currency: "USD", registration: 10, renewal: 16 },
      },
    ])

    expect(aggregated[0]?.bestProvider).toBe("namecheap")
    expect(aggregated[0]?.cheapestRegistration?.registration).toBe(10)
    expect(aggregated[0]?.cheapestRenewal?.renewal).toBe(14)
  })

  test("returns degraded results when one provider fails", async () => {
    const healthyProvider: DomainSearchProvider = {
      name: "cloudflare",
      async check(domains) {
        return domains.map((domain) => ({
          domain,
          provider: "cloudflare" as const,
          status: "available" as const,
          registrable: true,
          checkedAt: "2026-06-08T12:00:00.000Z",
          price: { currency: "USD", registration: 10, renewal: 10 },
        }))
      },
    }
    const failingProvider: DomainSearchProvider = {
      name: "vercel",
      async check() {
        throw new Error("Vercel is unavailable")
      },
    }

    const response = await searchDomains(
      {
        query: "jobticket",
        tlds: ["dev"],
        providers: ["cloudflare", "vercel"],
      },
      {
        providers: [healthyProvider, failingProvider],
      },
    )

    expect(response.results).toHaveLength(6)
    expect(
      response.results[0]?.providerResults.some(
        (result) => result.provider === "vercel" && result.status === "error",
      ),
    ).toBe(true)
  })

  test("rejects requests that would generate too many candidates", () => {
    expect(() =>
      validateSearchRequest({
        query: "jobticket",
        tlds: Array.from({ length: 30 }, (_, index) => `tld${index}`),
      }),
    ).toThrow("Too many candidates requested")
  })
})
