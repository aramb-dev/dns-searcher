import type { Metadata } from "next"
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[color:var(--page-background)] text-[color:var(--foreground)]">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(113,222,219,0.3),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(241,106,79,0.22),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#f4fbfd_52%,_#eef6fb_100%)]" />
        <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.35),transparent)]" />
        {children}
      </body>
    </html>
  )
}
