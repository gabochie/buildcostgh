const baseUrl = () => process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BuildCost GH",
    url: baseUrl(),
    logo: `${baseUrl()}/brand/logo-primary-1200w.png`,
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

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuildCost GH",
    alternateName: "BuildCost Ghana",
    url: baseUrl(),
    description:
      "Free construction cost calculator and building cost estimates for Ghana. Region-specific pricing across all 16 regions for Ghanaians and the diaspora.",
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "BuildCost GH",
      url: baseUrl(),
      logo: `${baseUrl()}/brand/logo-primary-1200w.png`,
    },
  }
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function faqLd(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  }
}
