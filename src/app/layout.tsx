import type { Metadata } from "next"
import { Inter, Playfair_Display, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Providers } from "@/components/Providers"
import { Analytics } from "@/components/shared/Analytics"
import { ChatWidget } from "@/components/shared/ChatWidget"
import { CookieConsent } from "@/components/shared/CookieConsent"
import { WhatsAppButton } from "@/components/shared/WhatsAppButton"
import { ExitIntentPopup } from "@/components/shared/ExitIntentPopup"
import { ServerInit } from "@/components/ServerInit"
import { organizationLd } from "./ld"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "BuildCost GH - Ghana Construction Cost Calculator for Ghanaians & the African Diaspora",
  description:
    "Get accurate construction cost estimates in seconds. Built for Ghanaians and the global African diaspora planning to build or invest in real estate in Ghana.",
  keywords: ["construction cost", "Ghana", "African diaspora", "building estimate", "house cost", "diaspora investment", "BuildCost GH"],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "BuildCost GH - Construction Cost Calculator for Ghanaians & the Diaspora",
    description: "Get accurate construction cost estimates in seconds. Built for Ghanaians and the global African diaspora planning to build in Ghana.",
    type: "website",
    locale: "en_GH",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ServerInit />
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Analytics />
          <CookieConsent />
          <WhatsAppButton />
          <ChatWidget />
          <ExitIntentPopup />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd()) }}
          />
        </Providers>
      </body>
    </html>
  )
}
