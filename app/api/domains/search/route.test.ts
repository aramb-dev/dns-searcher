import { describe, expect, test } from "bun:test"
import { createDomainSearchRoute } from "@/lib/domainSearch/searchRoute"
import { DomainSearchError } from "@/lib/domainSearch/searchDomains"

describe("POST /api/domains/search", () => {
  test("returns successful search results from the injected executor", async () => {
    const handler = createDomainSearchRoute(async () => ({
      query: "jobticket",
      candidates: ["jobticket.dev"],
      checkedAt: "2026-06-08T12:00:00.000Z",
      results: [
        {
          domain: "jobticket.dev",
          availability: "available",
          bestProvider: "cloudflare",
          cheapestRegistration: {
            provider: "cloudflare",
            currency: "USD",
            registration: 12,
          },
          cheapestRenewal: {
            provider: "cloudflare",
            currency: "USD",
            renewal: 14,
          },
          premium: false,
          providerResults: [],
          checkedAt: "2026-06-08T12:00:00.000Z",
        },
      ],
    }))

    const response = await handler(
      new Request("http://localhost/api/domains/search", {
        method: "POST",
        body: JSON.stringify({ query: "jobticket" }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.query).toBe("jobticket")
  })

  test("returns validation failures with the configured status code", async () => {
    const handler = createDomainSearchRoute(async () => {
      throw new DomainSearchError("Enter at least two valid characters", 400)
    })

    const response = await handler(
      new Request("http://localhost/api/domains/search", {
        method: "POST",
        body: JSON.stringify({ query: "!" }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Enter at least two valid characters")
  })
})
