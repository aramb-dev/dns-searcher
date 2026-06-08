import type { Metadata } from "next"
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "DNS Searcher",
  description:
    "Compare domain availability, pricing, premium flags, and provider support across registrars.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[color:var(--page-background)] text-[color:var(--foreground)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[color:var(--ink-strong)] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--teal-500)]"
        >
          Skip to content
        </a>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(113,222,219,0.3),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(241,106,79,0.22),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#f4fbfd_52%,_#eef6fb_100%)]" />
        <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.35),transparent)]" />
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}
