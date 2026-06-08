import { cloudflareProvider } from "@/lib/domainSearch/providers/cloudflareProvider"
import { namecheapProvider } from "@/lib/domainSearch/providers/namecheapProvider"
import { vercelProvider } from "@/lib/domainSearch/providers/vercelProvider"
import type { DomainProvider, DomainSearchProvider } from "@/lib/domainSearch/types"

const providersByName: Record<DomainProvider, DomainSearchProvider> = {
  cloudflare: cloudflareProvider,
  namecheap: namecheapProvider,
  vercel: vercelProvider,
}

export function getProviders(names: DomainProvider[]) {
  return names.map((name) => providersByName[name])
}
