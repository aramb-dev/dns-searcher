import { providerRequestTimeoutMs } from "@/lib/domainSearch/constants"
import type {
  DomainCheckResult,
  DomainProvider,
} from "@/lib/domainSearch/types"

export function buildTimestamp() {
  return new Date().toISOString()
}

export function createErrorResults(
  provider: DomainProvider,
  domains: string[],
  reason: string,
) {
  const checkedAt = buildTimestamp()

  return domains.map<DomainCheckResult>((domain) => ({
    domain,
    provider,
    status: "error",
    registrable: false,
    reason,
    checkedAt,
  }))
}

export async function withTimeout<T>(
  label: string,
  callback: (signal: AbortSignal) => Promise<T>,
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(label), providerRequestTimeoutMs)

  try {
    return await callback(controller.signal)
  } finally {
    clearTimeout(timeoutId)
  }
}

export function chunkDomains(domains: string[], size: number) {
  const chunks: string[][] = []

  for (let index = 0; index < domains.length; index += size) {
    chunks.push(domains.slice(index, index + size))
  }

  return chunks
}

export function parsePrice(value?: string | number | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }

  if (!value) {
    return undefined
  }

  const normalized = Number.parseFloat(String(value))
  return Number.isFinite(normalized) ? normalized : undefined
}
