import { defaultPrefixes } from "@/lib/domainSearch/constants"

export function normalizeDomainQuery(query: string) {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
}

export function normalizeTld(tld: string) {
  return tld.trim().toLowerCase().replace(/^\.+/, "")
}

export function generateCandidates(query: string, tlds: string[]) {
  const root = normalizeDomainQuery(query)

  if (!root) {
    return []
  }

  const names = new Set<string>()

  for (const prefix of defaultPrefixes) {
    const label = prefix ? `${prefix}${root}` : root

    for (const tld of tlds) {
      const cleanTld = normalizeTld(tld)

      if (!cleanTld) {
        continue
      }

      names.add(`${label}.${cleanTld}`)
    }
  }

  return [...names]
}
