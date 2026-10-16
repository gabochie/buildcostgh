import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Providers } from "@/components/Providers"
import { Analytics } from "@/components/shared/Analytics"
import { ChatWidget } from "@/components/shared/ChatWidget"
import { CookieConsent } from "@/components/shared/CookieConsent"
import { WhatsAppButton } from "@/components/shared/WhatsAppButton"
import { ExitIntentPopup } from "@/components/shared/ExitIntentPopup"
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister"
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt"
import { PushPrompt } from "@/components/pwa/PushPrompt"
import { ServerInit } from "@/components/ServerInit"
import { organizationLd, websiteLd } from "./ld"

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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "BuildCost GH - Ghana Construction Cost Calculator for Ghanaians & the African Diaspora",
  description:
    "Get accurate construction cost estimates in seconds. How much does it cost to build a house in Ghana? Free calculator, region-specific pricing across all 16 regions, and reports built for Ghanaians and the global African diaspora.",
  keywords: [
    "construction cost Ghana",
    "how much to build a house in Ghana",
    "building cost calculator Ghana",
    "house building cost Accra",
    "Ghana building estimate",
    "cost per square metre Ghana",
    "African diaspora",
    "diaspora investment",
    "BuildCost GH",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/assets/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/assets/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/assets/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BuildCost GH",
  },
  alternates: {
    canonical: "/",
  },
  other: {
    "google-adsense-account": "ca-pub-1299715274212521",
  },
  openGraph: {
    title: "BuildCost GH - Construction Cost Calculator for Ghanaians & the Diaspora",
    description: "Get accurate construction cost estimates in seconds. Built for Ghanaians and the global African diaspora planning to build in Ghana.",
    type: "website",
    locale: "en_GH",
    siteName: "BuildCost GH",
    images: [{ url: "/assets/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildCost GH - Construction Cost Calculator for Ghanaians & the Diaspora",
    description: "Get accurate construction cost estimates in seconds. Built for Ghanaians and the global African diaspora planning to build in Ghana.",
    images: ["/assets/og-image.jpg"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#059669",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ServerInit />
        <Providers>
          <Header />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <ServiceWorkerRegister />
          <PwaInstallPrompt />
          <PushPrompt />
          <Analytics />
          <CookieConsent />
          <WhatsAppButton />
          <ChatWidget />
          <ExitIntentPopup />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd()) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd()) }}
          />
        </Providers>
      </body>
    </html>
  )
}
