export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BuildCost GH",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com",
    logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+233-53-936-4716",
      contactType: "customer service",
      areaServed: "GH",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tema",
      addressRegion: "Greater Accra",
      addressCountry: "GH",
    },
  }
}

export function productLd(name: string, price: number, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "GHS",
      availability: "https://schema.org/InStock",
    },
  }
}
