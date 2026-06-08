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
      return "Available to register"
    case "premium":
      return "Premium listing"
    case "unavailable":
      return "Already registered"
    case "unsupported":
      return "Unsupported by selected providers"
    default:
      return "Unknown"
  }
}

function ResultRow({ result }: { result: AggregatedDomainResult }) {
  return (
    <tr className="border-b border-[color:var(--border-soft)] last:border-b-0">
      <td className="px-4 py-4 align-top">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[color:var(--ink-strong)]">
            {result.domain}
          </p>
          <p className="text-xs text-[color:var(--ink-muted)]">
            {getAvailabilityCopy(result)}
          </p>
        </div>
      </td>
      <td className="px-4 py-4 align-top text-sm text-[color:var(--ink-soft)]">
        {result.availability}
      </td>
      <td className="px-4 py-4 align-top text-sm text-[color:var(--ink-soft)]">
        {result.bestProvider ?? "—"}
      </td>
      <td className="px-4 py-4 align-top text-sm text-[color:var(--ink-soft)]">
        {formatCurrency(
          result.cheapestRegistration?.registration,
          result.cheapestRegistration?.currency,
        )}
      </td>
      <td className="px-4 py-4 align-top text-sm text-[color:var(--ink-soft)]">
        {formatCurrency(
          result.cheapestRenewal?.renewal,
          result.cheapestRenewal?.currency,
        )}
      </td>
      <td className="px-4 py-4 align-top text-sm text-[color:var(--ink-soft)]">
        {result.premium ? "Yes" : "No"}
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap gap-2">
          {result.providerResults.map((providerResult) => (
            <span
              key={`${result.domain}-${providerResult.provider}`}
              className="rounded-full border border-[color:var(--border-soft)] bg-white/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]"
            >
              {providerResult.provider}: {providerResult.status}
            </span>
          ))}
        </div>
      </td>
    </tr>
  )
}

function ResultsTable({
  checkedAt,
  results,
}: {
  checkedAt?: string
  results: AggregatedDomainResult[]
}) {
  if (results.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[color:var(--border-strong)] bg-white/55 p-8 text-sm text-[color:var(--ink-soft)] backdrop-blur-sm">
        Search for a root name to compare registry-level availability, premium
        flags, and provider support side by side.
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[color:var(--border-strong)] bg-white/78 shadow-[0_32px_80px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[color:var(--border-soft)] px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">
            Results
          </p>
          <h2 className="text-lg font-semibold text-[color:var(--ink-strong)]">
            Provider comparison
          </h2>
        </div>
        <p className="text-xs text-[color:var(--ink-muted)]">
          Checked {checkedAt ? new Date(checkedAt).toLocaleTimeString() : "just now"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-[color:var(--panel-muted)] text-left">
            <tr>
              {[
                "Domain",
                "Registry status",
                "Best provider",
                "First year",
                "Renewal",
                "Premium",
                "Provider support",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-muted)]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <ResultRow key={result.domain} result={result} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

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

  const availableCount = searchState.results.filter(
    (result) => result.availability === "available" || result.availability === "premium",
  ).length
  const cheapestDomain = [...searchState.results]
    .filter((result) => typeof result.cheapestRegistration?.registration === "number")
    .sort(
      (left, right) =>
        (left.cheapestRegistration?.registration ?? Number.POSITIVE_INFINITY) -
        (right.cheapestRegistration?.registration ?? Number.POSITIVE_INFINITY),
    )[0]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.6fr)]">
        <div className="rounded-[2rem] border border-[color:var(--border-strong)] bg-[color:var(--panel)] p-6 shadow-[0_40px_90px_rgba(14,25,38,0.12)] backdrop-blur-md sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--ink-muted)]">
                Registrar meta-search
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-[color:var(--ink-strong)] sm:text-5xl">
                Find domains you can actually buy, compare, and ship with.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-[color:var(--ink-soft)] sm:text-base">
                Search one root name, fan out across Cloudflare, Namecheap, and
                Vercel, and compare price, premium status, and support without
                pretending availability changes by provider.
              </p>
            </div>
            <div className="space-y-2">
              <div className="rounded-full border border-[color:var(--border-soft)] bg-white/80 px-4 py-2 text-xs text-[color:var(--ink-soft)]">
                Registry truth first
              </div>
              <div className="rounded-full border border-[color:var(--border-soft)] bg-white/80 px-4 py-2 text-xs text-[color:var(--ink-soft)]">
                Provider adapters: 3
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">
                  Root name
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="jobticket"
                  className="w-full rounded-[1.4rem] border border-[color:var(--border-strong)] bg-white/90 px-5 py-4 text-lg text-[color:var(--ink-strong)] outline-none transition focus:border-[color:var(--teal-500)] focus:ring-4 focus:ring-[color:var(--teal-ring)]"
                />
              </label>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">
                  TLDs
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {defaultTlds.map((tld) => {
                    const selected = selectedTlds.includes(tld)

                    return (
                      <button
                        key={tld}
                        type="button"
                        onClick={() => toggleTld(tld)}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          selected
                            ? "border border-transparent bg-[color:var(--ink-strong)] text-white shadow-[0_12px_24px_rgba(18,34,45,0.18)]"
                            : "border border-[color:var(--border-soft)] bg-white/80 text-[color:var(--ink-soft)]"
                        }`}
                      >
                        .{tld}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">
                  Providers
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {domainProviders.map((provider) => {
                    const selected = selectedProviders.includes(provider)

                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => toggleProvider(provider)}
                        className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                          selected
                            ? "border border-transparent bg-[color:var(--coral-500)] text-white shadow-[0_12px_24px_rgba(241,106,79,0.24)]"
                            : "border border-[color:var(--border-soft)] bg-white/80 text-[color:var(--ink-soft)]"
                        }`}
                      >
                        {provider}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isPending}
                  className="inline-flex min-w-40 items-center justify-center rounded-full bg-[color:var(--coral-500)] px-6 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(241,106,79,0.32)] transition hover:bg-[color:var(--coral-600)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Checking domains..." : "Search domains"}
                </button>
                <p className="text-sm text-[color:var(--ink-muted)]">
                  Up to 100 generated candidates per request.
                </p>
              </div>

              {searchState.error ? (
                <div className="rounded-[1.25rem] border border-[color:var(--coral-500)]/30 bg-[color:var(--coral-wash)] px-4 py-3 text-sm text-[color:var(--ink-strong)]">
                  {searchState.error}
                </div>
              ) : null}
            </div>

            <aside className="rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">
                Search notes
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-[color:var(--ink-strong)]">
                    {availableCount}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    Registrable or premium candidates in the latest result set
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
                    Cheapest visible option
                  </p>
                  <p className="mt-2 text-lg font-medium text-[color:var(--ink-strong)]">
                    {cheapestDomain?.domain ?? "Run a search"}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    {cheapestDomain?.bestProvider
                      ? `${cheapestDomain.bestProvider} from ${formatCurrency(
                          cheapestDomain.cheapestRegistration?.registration,
                          cheapestDomain.cheapestRegistration?.currency,
                        )}`
                      : "Pricing appears here when at least one provider returns a first-year price."}
                  </p>
                </div>
                <div className="text-sm leading-7 text-[color:var(--ink-soft)]">
                  <p>
                    Availability is displayed as a registry-level outcome.
                  </p>
                  <p>
                    Provider rows describe support, pricing, and premium
                    treatment without implying conflicting ownership states.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[color:var(--border-strong)] bg-[color:var(--panel)] p-6 shadow-[0_30px_80px_rgba(10,24,37,0.08)] backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--ink-muted)]">
            Provider posture
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-[1.4rem] bg-white/85 p-4">
              <p className="text-sm font-medium text-[color:var(--ink-strong)]">
                Cloudflare
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Batched availability checks with price signals and strong DNS
                setup alignment.
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-white/85 p-4">
              <p className="text-sm font-medium text-[color:var(--ink-strong)]">
                Namecheap
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Bulk checking plus premium detection and price snapshots by TLD.
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-white/85 p-4">
              <p className="text-sm font-medium text-[color:var(--ink-strong)]">
                Vercel
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                Useful for developer deployment fit and registrar availability on
                supported TLDs.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <ResultsTable checkedAt={searchState.checkedAt} results={searchState.results} />

      {searchState.query ? (
        <p className="text-right text-xs uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
          Latest search: {searchState.query}
        </p>
      ) : null}
    </div>
  )
}
