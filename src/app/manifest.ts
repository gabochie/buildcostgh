import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BuildCost GH — Ghana Construction Cost Calculator",
    short_name: "BuildCost GH",
    description:
      "Get accurate construction cost estimates in seconds. Region-specific pricing across all 16 regions of Ghana.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#059669",
    lang: "en-GH",
    dir: "ltr",
    categories: ["finance", "utilities", "business"],
    icons: [
      {
        src: "/assets/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Calculate costs",
        short_name: "Calculate",
        description: "Start a new construction cost estimate",
        url: "/calculator?source=pwa-shortcut",
        icons: [{ src: "/assets/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Costs by region",
        short_name: "Costs",
        description: "Browse region-specific construction costs",
        url: "/costs?source=pwa-shortcut",
        icons: [{ src: "/assets/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "My estimates",
        short_name: "Estimates",
        description: "View your saved estimates",
        url: "/dashboard?source=pwa-shortcut",
        icons: [{ src: "/assets/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  }
}
