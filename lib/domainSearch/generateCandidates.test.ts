import { describe, expect, test } from "bun:test"
import {
  generateCandidates,
  normalizeDomainQuery,
} from "@/lib/domainSearch/generateCandidates"

describe("generateCandidates", () => {
  test("normalizes the query and generates prefixed candidates", () => {
    const query = normalizeDomainQuery(" Job Ticket! ")
    const candidates = generateCandidates(query, ["com", ".dev", "com"])

    expect(query).toBe("jobticket")
    expect(candidates).toEqual([
      "jobticket.com",
      "jobticket.dev",
      "getjobticket.com",
      "getjobticket.dev",
      "usejobticket.com",
      "usejobticket.dev",
      "tryjobticket.com",
      "tryjobticket.dev",
      "gojobticket.com",
      "gojobticket.dev",
      "myjobticket.com",
      "myjobticket.dev",
    ])
  })

  test("returns an empty list for invalid input", () => {
    expect(generateCandidates("!!!", ["com"])).toEqual([])
  })
})
