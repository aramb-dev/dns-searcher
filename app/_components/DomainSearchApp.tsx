"use client"

import { useState, useTransition } from "react"
import {
  defaultProviders,
  defaultTlds,
} from "@/lib/domainSearch/constants"
import { domainProviders } from "@/lib/domainSearch/types"
import type {
  AggregatedDomainResult,
  DomainProvider,
  DomainSearchResponse,
} from "@/lib/domainSearch/types"

type SearchState = {
  checkedAt?: string
  error?: string
  query?: string
  results: AggregatedDomainResult[]
}

function formatCurrency(value?: number, currency = "USD") {
  if (typeof value !== "number") {
    return "—"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function getAvailabilityCopy(result: AggregatedDomainResult) {
  switch (result.availability) {
    case "available":
      return "Available"
    case "premium":
      return "Premium"
    case "unavailable":
      return "Taken"
    case "unsupported":
      return "Unsupported"
    default:
      return "Unknown"
  }
}

// Colored SVG Logos for Providers
const CloudflareIcon = () => (
  <svg className="h-7 w-7 text-[#F38020]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.375 15.176c-.21.05-.43.08-.66.08H5.5a4.5 4.5 0 01-4.43-3.77c.14.02.28.03.43.03h.17A4.49 4.49 0 016 7c.72 0 1.39.17 2 .47A4.47 4.47 0 0112 5c1.68 0 3.12 1 3.73 2.45.67-.3 1.41-.45 2.18-.45A4.5 4.5 0 0122.5 11.5c0 2.22-1.6 4.07-3.12 3.68z" />
  </svg>
)

const NamecheapIcon = () => (
  <svg className="h-7 w-7 text-[#DE3720]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h4v6.5l8-6.5h4v16h-4v-6.5l-8 6.5H4V4z" />
  </svg>
)

const VercelIcon = () => (
  <svg className="h-6 w-6 text-black" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 22h20L12 2z" />
  </svg>
)

// UI SVG Icons
const KeyIcon = () => (
  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 002-2m-2 2h.01M19 8.8c.04.4.07.82.07 1.2a9 9 0 11-18 0c0-4.97 4.03-9 9-9 1.13 0 2.22.21 3.22.6m3 4a1.8 1.8 0 11-3.6 0 1.8 1.8 0 013.6 0z" />
  </svg>
)

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-3.5 h-3.5 text-[color:var(--teal-500)] hover:text-teal-700 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-4.5 h-4.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const ExportIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

export function DomainSearchApp() {
  const [query, setQuery] = useState("jobticket")
  const [selectedTlds, setSelectedTlds] = useState<string[]>([...defaultTlds])
  const [selectedProviders, setSelectedProviders] =
    useState<DomainProvider[]>(defaultProviders)
  const [searchState, setSearchState] = useState<SearchState>({ results: [] })
  const [isPending, startTransition] = useTransition()



  function toggleTld(tld: string) {
    setSelectedTlds((current) =>
      current.includes(tld)
        ? current.filter((item) => item !== tld)
        : [...current, tld],
    )
  }

  function toggleProvider(provider: DomainProvider) {
    setSelectedProviders((current) =>
      current.includes(provider)
        ? current.filter((item) => item !== provider)
        : [...current, provider],
    )
  }

  async function handleSearch() {
    startTransition(async () => {
      setSearchState((current) => ({ ...current, error: undefined }))

      try {
        const response = await fetch("/api/domains/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            tlds: selectedTlds,
            providers: selectedProviders,
          }),
        })
        const payload = (await response.json()) as DomainSearchResponse & {
          error?: string
        }

        if (!response.ok) {
          throw new Error(payload.error ?? "Search failed")
        }

        setSearchState({
          checkedAt: payload.checkedAt,
          query: payload.query,
          results: payload.results,
        })
      } catch (error) {
        setSearchState({
          error: error instanceof Error ? error.message : "Search failed",
          results: [],
        })
      }
    })
  }

  // Export search results to CSV
  function exportToCsv() {
    if (searchState.results.length === 0) return
    const headers = ["Domain", "Registry Status", "Best Provider", "First Year Price", "Renewal Price", "Premium Price"]
    const rows = searchState.results.map((result) => [
      result.domain,
      getAvailabilityCopy(result),
      result.bestProvider ?? "—",
      result.cheapestRegistration?.registration ? `$${result.cheapestRegistration.registration}` : "—",
      result.cheapestRenewal?.renewal ? `$${result.cheapestRenewal.renewal}` : "—",
      result.premium && result.cheapestRegistration?.registration ? `$${result.cheapestRegistration.registration}` : "—"
    ])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `dns_search_results_${searchState.query || 'export'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculations for Summary
  const cheapestResult = [...searchState.results]
    .filter(r => typeof r.cheapestRegistration?.registration === "number")
    .sort((a, b) => (a.cheapestRegistration?.registration ?? Number.POSITIVE_INFINITY) - (b.cheapestRegistration?.registration ?? Number.POSITIVE_INFINITY))[0]

  const bestValueResult = [...searchState.results]
    .filter(r => typeof r.cheapestRegistration?.registration === "number" && typeof r.cheapestRenewal?.renewal === "number")
    .map(r => ({
      result: r,
      total2Years: (r.cheapestRegistration?.registration ?? 0) + (r.cheapestRenewal?.renewal ?? 0)
    }))
    .sort((a, b) => a.total2Years - b.total2Years)[0]?.result

  const renderStatus = (status: string) => {
    switch (status) {
      case "available":
        return (
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
            </svg>
            <span>Available</span>
          </div>
        )
      case "premium":
        return (
          <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-sm">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Premium</span>
          </div>
        )
      case "unavailable":
        return (
          <div className="flex items-center gap-1.5 text-rose-500 font-semibold text-sm">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Taken</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>Unsupported</span>
          </div>
        )
    }
  }

  const renderBestProvider = (result: AggregatedDomainResult) => {
    if (!result.bestProvider) return <span className="text-slate-400">—</span>
    const icon = result.bestProvider === "cloudflare" ? <CloudflareIcon /> : result.bestProvider === "namecheap" ? <NamecheapIcon /> : <VercelIcon />
    const name = result.bestProvider === "cloudflare" ? "Cloudflare" : result.bestProvider === "namecheap" ? "Namecheap" : "Vercel"
    return (
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-[color:var(--ink-strong)] text-sm">{name}</span>
        {typeof result.cheapestRegistration?.registration === "number" && (
          <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-600 border border-teal-100">
            BEST PRICE
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      {/* Header section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[color:var(--border-soft)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono">
            <div className="bg-[color:var(--teal-500)] text-white px-2.5 py-1 rounded-lg font-extrabold text-2xl tracking-tight leading-none shadow-sm shadow-teal-500/10">
              DNS
            </div>
            <span className="text-2xl font-bold text-[color:var(--ink-strong)] tracking-tight">
              Searcher
            </span>
          </div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[color:var(--ink-muted)]">
            DOMAIN META-SEARCH. FIND. COMPARE. REGISTER.
          </p>
        </div>

        {/* Center Live data status pill */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-white/80 px-4 py-1.5 text-xs text-[color:var(--ink-soft)] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">Live data from {selectedProviders.length} registrars</span>
          <span className="text-[color:var(--ink-muted)]">•</span>
          <span className="text-[color:var(--ink-muted)]">Updated just now</span>
        </div>


      </header>

      {/* Search Controls Panel */}
      <section className="rounded-3xl border border-[color:var(--border-strong)] bg-white p-6 shadow-md shadow-slate-100/50">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Search for a Domain */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[color:var(--ink-soft)]">
              Search for a domain
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                name="query"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g., jobticket…"
                className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-slate-50/50 px-5 py-4 text-xl font-semibold text-[color:var(--ink-strong)] outline-none transition focus-visible:border-[color:var(--teal-500)] focus-visible:ring-4 focus-visible:ring-[color:var(--teal-ring)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-4 text-[color:var(--ink-muted)] hover:text-[color:var(--ink-strong)]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Select TLDs */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[color:var(--ink-soft)]">
              Select TLDs
            </label>
            <div className="flex flex-wrap gap-2.5">
              {defaultTlds.map((tld) => {
                const selected = selectedTlds.includes(tld)

                return (
                  <button
                    key={tld}
                    type="button"
                    onClick={() => toggleTld(tld)}
                    className={`flex items-center gap-1.5 rounded-xl border px-4.5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--teal-500)] focus-visible:ring-offset-2 ${
                      selected
                        ? "border-transparent bg-[color:var(--teal-500)] text-white shadow-sm"
                        : "border-[color:var(--border-soft)] bg-white hover:bg-slate-50 text-[color:var(--ink-soft)]"
                    }`}
                  >
                    .{tld}
                    {selected && <CheckIcon />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Compare Providers & CTA Row */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-t border-[color:var(--border-soft)] pt-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[color:var(--ink-soft)]">
              Compare Providers
            </label>
            <div className="flex flex-wrap gap-3">
              {domainProviders.map((provider) => {
                const active = selectedProviders.includes(provider)
                const logo = provider === "cloudflare" ? <CloudflareIcon /> : provider === "namecheap" ? <NamecheapIcon /> : <VercelIcon />
                const name = provider === "cloudflare" ? "Cloudflare" : provider === "namecheap" ? "Namecheap" : "Vercel"

                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => toggleProvider(provider)}
                    className={`flex items-center justify-between gap-6 rounded-2xl border px-4.5 py-3 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--teal-500)] focus-visible:ring-offset-2 ${
                      active
                        ? "border-[color:var(--border-strong)] bg-white"
                        : "border-[color:var(--border-soft)] bg-white/50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {logo}
                      <div className="text-left">
                        <p className="text-sm font-bold text-[color:var(--ink-strong)]">
                          {name}
                        </p>
                        <p className="text-[10px] text-[color:var(--ink-muted)]">
                          Registrar
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className={`relative h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${
                      active ? "bg-[color:var(--teal-500)]" : "bg-slate-200"
                    }`}>
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                        active ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isPending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF5A43] to-[#FF472E] px-8 py-4 font-bold text-white shadow-md shadow-orange-500/10 hover:from-[#FF472E] hover:to-[#E53B23] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A43] focus-visible:ring-offset-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  SEARCHING…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  SEARCH DOMAINS
                </>
              )}
            </button>
          </div>
        </div>

        {searchState.error ? (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 rounded-2xl border border-[color:var(--coral-500)]/30 bg-[color:var(--coral-wash)] px-4 py-3.5 text-sm text-[color:var(--ink-strong)]"
          >
            {searchState.error}
          </div>
        ) : null}
      </section>

      {/* Results Section */}
      {searchState.results.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          
          {/* Left Side: Table of Results */}
          <section className="overflow-hidden rounded-3xl border border-[color:var(--border-strong)] bg-white p-6 shadow-md shadow-slate-100/50">
            <div className="flex items-center justify-between border-b border-[color:var(--border-soft)] pb-4 mb-4">
              <div className="flex items-center gap-2">
                {/* Table icon */}
                <svg className="w-5 h-5 text-[color:var(--teal-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <h2 className="font-mono font-extrabold text-sm uppercase tracking-wider text-[color:var(--ink-soft)]">
                  Search Results
                </h2>
                <span className="text-xs text-[color:var(--ink-muted)] bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">
                  {searchState.results.length} results
                </span>
              </div>
              <button
                type="button"
                onClick={exportToCsv}
                className="flex items-center gap-1.5 rounded-xl border border-[color:var(--border-soft)] bg-white hover:bg-slate-50 px-4.5 py-2 text-xs font-bold text-[color:var(--ink-soft)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--teal-500)] focus-visible:ring-offset-2 shadow-sm"
              >
                <ExportIcon />
                EXPORT CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[color:var(--border-soft)] text-[10px] font-mono font-extrabold uppercase tracking-widest text-[color:var(--ink-muted)]">
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Registry Status</th>
                    <th className="px-4 py-3">Best Provider</th>
                    <th className="px-4 py-3 text-right">First Year</th>
                    <th className="px-4 py-3 text-right">Renewal</th>
                    <th className="px-4 py-3 text-right">Premium</th>
                    <th className="px-4 py-3">Provider Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border-soft)]">
                  {searchState.results.map((result) => (
                    <tr key={result.domain} className="hover:bg-slate-50/50 transition">
                      {/* Domain column */}
                      <td className="px-4 py-4">
                        <a
                          href={`https://${result.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-bold text-[color:var(--ink-strong)] hover:text-[color:var(--teal-500)] transition text-sm break-all"
                        >
                          {result.domain}
                          <ExternalLinkIcon />
                        </a>
                      </td>

                      {/* Registry status column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {renderStatus(result.availability)}
                      </td>

                      {/* Best provider column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {renderBestProvider(result)}
                      </td>

                      {/* First year price column */}
                      <td className="px-4 py-4 text-right font-mono font-bold text-teal-600 whitespace-nowrap text-sm">
                        {formatCurrency(
                          result.cheapestRegistration?.registration,
                          result.cheapestRegistration?.currency,
                        )}
                      </td>

                      {/* Renewal price column */}
                      <td className="px-4 py-4 text-right font-mono text-[color:var(--ink-soft)] whitespace-nowrap text-sm">
                        {formatCurrency(
                          result.cheapestRenewal?.renewal,
                          result.cheapestRenewal?.currency,
                        )}
                      </td>

                      {/* Premium cost column */}
                      <td className="px-4 py-4 text-right font-mono whitespace-nowrap text-sm">
                        {result.premium ? (
                          <span className="font-bold text-rose-500">
                            {formatCurrency(
                              result.cheapestRegistration?.registration,
                              result.cheapestRegistration?.currency,
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Provider support column */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                            WHOIS
                          </span>
                          <ShieldIcon />
                          {result.bestProvider !== "vercel" && (
                            <span className="rounded-md border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                              DNSSEC
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[color:var(--border-soft)] pt-6">
              {/* Legends */}
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-[color:var(--ink-soft)] bg-slate-50/50 rounded-xl px-4 py-2 border border-[color:var(--border-soft)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Premium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Taken</span>
                </div>
              </div>

              <p className="text-xs text-[color:var(--ink-muted)]">
                Prices in USD. Taxes may apply.
              </p>
            </div>
          </section>

          {/* Right Side: Summary Panels */}
          <aside className="space-y-6">
            {/* Summary Card */}
            <div className="rounded-3xl border border-[color:var(--border-strong)] bg-white p-6 shadow-md shadow-slate-100/50">
              <div className="flex items-center gap-2 border-b border-[color:var(--border-soft)] pb-4 mb-4">
                {/* Chart Icon */}
                <svg className="w-5 h-5 text-[color:var(--teal-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="font-mono font-extrabold text-xs uppercase tracking-wider text-[color:var(--ink-soft)]">
                  Summary
                </h3>
              </div>

              <div className="space-y-5">
                {/* Cheapest domain */}
                {cheapestResult ? (
                  <div className="flex items-center justify-between border-b border-dashed border-[color:var(--border-soft)] pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--ink-muted)]">
                        Cheapest Domain
                      </p>
                      <p className="font-bold text-[color:var(--ink-strong)] text-sm mt-0.5">
                        {cheapestResult.domain}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teal-600">
                        {formatCurrency(
                          cheapestResult.cheapestRegistration?.registration,
                          cheapestResult.cheapestRegistration?.currency,
                        )}
                      </p>
                      <p className="text-[9px] font-semibold text-[color:var(--ink-muted)] capitalize mt-0.5">
                        via {cheapestResult.bestProvider}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[color:var(--ink-muted)] leading-relaxed">
                    Cheapest domain pricing will appear here.
                  </p>
                )}

                {/* Best value domain over 2 years */}
                {bestValueResult ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[color:var(--ink-muted)]">
                        Best Value (2 Years)
                      </p>
                      <p className="font-bold text-[color:var(--ink-strong)] text-sm mt-0.5">
                        {bestValueResult.domain}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teal-600">
                        {formatCurrency(
                          (bestValueResult.cheapestRegistration?.registration ?? 0) +
                            (bestValueResult.cheapestRenewal?.renewal ?? 0),
                          bestValueResult.cheapestRegistration?.currency,
                        )}
                      </p>
                      <p className="text-[9px] font-semibold text-[color:var(--ink-muted)] capitalize mt-0.5">
                        via {bestValueResult.bestProvider}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[color:var(--ink-muted)] border-t border-dashed border-[color:var(--border-soft)] pt-4 leading-relaxed">
                    Best value details will appear here.
                  </p>
                )}
              </div>
            </div>

            {/* Provider Notes Card */}
            <div className="rounded-3xl border border-[color:var(--border-strong)] bg-white p-6 shadow-md shadow-slate-100/50">
              <h3 className="font-mono font-extrabold text-xs uppercase tracking-wider text-[color:var(--ink-soft)] border-b border-[color:var(--border-soft)] pb-4 mb-4">
                Provider Notes
              </h3>
              <div className="space-y-4">
                {/* Cloudflare Note */}
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <CloudflareIcon />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[color:var(--ink-strong)]">Cloudflare</p>
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[8px] font-extrabold text-emerald-600">GREAT</span>
                    </div>
                    <p className="text-xs text-[color:var(--ink-muted)] leading-relaxed">
                      Transparent pricing, no upsells. Includes free WHOIS privacy.
                    </p>
                  </div>
                </div>

                {/* Namecheap Note */}
                <div className="flex gap-3 border-t border-[color:var(--border-soft)] pt-4">
                  <div className="mt-0.5">
                    <NamecheapIcon />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[color:var(--ink-strong)]">Namecheap</p>
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[8px] font-extrabold text-emerald-600">GREAT</span>
                    </div>
                    <p className="text-xs text-[color:var(--ink-muted)] leading-relaxed">
                      Wide TLD support and strong customer support.
                    </p>
                  </div>
                </div>

                {/* Vercel Note */}
                <div className="flex gap-3 border-t border-[color:var(--border-soft)] pt-4">
                  <div className="mt-0.5">
                    <VercelIcon />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[color:var(--ink-strong)]">Vercel</p>
                      <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[8px] font-extrabold text-amber-600">GOOD</span>
                    </div>
                    <p className="text-xs text-[color:var(--ink-muted)] leading-relaxed">
                      Developer-first experience. Seamless with Vercel projects.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tip Card */}
            <div className="rounded-3xl border border-teal-100 bg-teal-50/40 p-5 flex gap-3 shadow-sm shadow-teal-500/5">
              <div className="mt-0.5 text-teal-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[color:var(--ink-soft)] leading-relaxed">
                Tip: Enable WHOIS privacy at checkout for added protection.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
