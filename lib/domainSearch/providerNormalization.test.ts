import { describe, expect, test } from "bun:test"
import { mapCloudflareResult } from "@/lib/domainSearch/providers/cloudflareProvider"
import {
  mapNamecheapResult,
  parseNamecheapCheckResponse,
} from "@/lib/domainSearch/providers/namecheapProvider"
import { mapVercelResult } from "@/lib/domainSearch/providers/vercelProvider"

describe("provider normalization", () => {
  test("maps Cloudflare batched results into the shared shape", () => {
    const result = mapCloudflareResult({
      name: "jobticket.dev",
      available: true,
      can_register: true,
      supported_tld: true,
      premium: false,
      price: {
        currency: "USD",
        register: "12.00",
        renew: "14.00",
      },
    })

    expect(result.status).toBe("available")
    expect(result.registrable).toBe(true)
    expect(result.price?.registration).toBe(12)
    expect(result.price?.renewal).toBe(14)
  })

  test("parses and maps Namecheap premium results", () => {
    const parsed = parseNamecheapCheckResponse(
      `<?xml version="1.0"?>
      <DomainCheckResult Domain="jobticket.ai" Available="false" IsPremiumName="true" PremiumRegistrationPrice="130.00" PremiumRenewalPrice="90.00" />`,
    )

    expect(parsed).toHaveLength(1)

    const result = mapNamecheapResult(parsed[0], {
      currency: "USD",
    })

    expect(result.status).toBe("premium")
    expect(result.registrable).toBe(true)
    expect(result.price?.registration).toBe(130)
    expect(result.price?.renewal).toBe(90)
  })

  test("maps unsupported Vercel results", () => {
    const result = mapVercelResult({
      domain: "jobticket.xyz",
      supported: false,
    })

    expect(result.status).toBe("unsupported")
    expect(result.registrable).toBe(false)
  })
})
