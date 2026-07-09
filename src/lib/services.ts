export interface Service {
  slug: string
  title: string
  subtitle: string
  description: string
  benefits: string[]
  includedIn: string
  ctaText: string
}

export const services: Service[] = [
  {
    slug: "cost-estimation",
    title: "Cost Estimation",
    subtitle: "Accurate construction cost estimates powered by real Ghana market data — for Ghanaians & the global diaspora",
    description:
      "Get a detailed breakdown of your construction project costs based on your specific requirements. Our estimates factor in material prices, labor rates, and regional variations across all 16 regions of Ghana. Whether you're in Accra or abroad, simply enter your project details — bedrooms, location, floor area, finishing grade, and additional features — and receive an instant, accurate estimate.",
    benefits: [
      "Instant estimates based on real-time market data",
      "Region-specific pricing for Accra, Kumasi, Tamale and more",
      "Grade A, B, and C finishing options with detailed cost differences",
      "Additional features like pools, gardens, security, and solar",
      "Free basic estimate — no credit card required",
    ],
    includedIn: "Free (basic) / All paid packages",
    ctaText: "Get Your Free Estimate",
  },
  {
    slug: "pdf-reports",
    title: "PDF Reports",
    subtitle: "Professional construction cost reports in PDF format, ready to share",
    description:
      "Receive a professionally formatted PDF report with a complete breakdown of your construction costs. Perfect for sharing with contractors, architects, banks, and stakeholders. Each report is customized to your specific project and includes itemized costs, regional notes, and professional formatting.",
    benefits: [
      "Professionally formatted PDF with your project details",
      "Itemized cost breakdown by category",
      "Regional cost comparison notes",
      "DIY vs Contractor cost comparison",
      "Ready to print, share, or present",
    ],
    includedIn: "Basic package (GHS 99)",
    ctaText: "Get PDF Report — GHS 99",
  },
  {
    slug: "excel-spreadsheets",
    title: "Excel Spreadsheets",
    subtitle: "Editable Excel files with complete material quantities and cost tracking",
    description:
      "Take full control of your construction budget with our editable Excel spreadsheets. These comprehensive workbooks include material quantities, cost tracking sheets, payment schedules, and budget vs actual tracking. Modify line items, adjust quantities, and track your spending throughout the project lifecycle.",
    benefits: [
      "Editable Excel workbook with all cost data",
      "Complete material quantities with unit prices",
      "Budget vs actual cost tracking sheets",
      "Payment schedule and milestone tracker",
      "Supplier comparison and quote management",
    ],
    includedIn: "Detailed package (GHS 249) and above",
    ctaText: "Get Excel Spreadsheet — GHS 249",
  },
  {
    slug: "contractor-contacts",
    title: "Contractor Contacts",
    subtitle: "Vetted contractor contacts for your specific region and project type",
    description:
      "Stop searching for reliable contractors. Get access to our curated list of vetted contractors in your region. We verify credentials, check past project quality, and match contractors to your project type and budget. Includes direct phone numbers, email contacts, and references.",
    benefits: [
      "Vetted and verified contractor contacts",
      "Contractors matched to your region and project type",
      "Direct phone numbers and email contacts",
      "Past project references and portfolio links",
      "Price range information for each contractor",
    ],
    includedIn: "Detailed (GHS 249) and Premium (GHS 499) packages",
    ctaText: "Get Contractor Contacts — GHS 249",
  },
  {
    slug: "consultation",
    title: "Consultation",
    subtitle: "Expert construction consultation to guide your project decisions",
    description:
      "Speak directly with construction experts who understand the Ghana market. Our consultants help you review your cost estimates, choose the right materials, select contractors, and plan your project timeline. Available as a one-time consultation or ongoing project advisory.",
    benefits: [
      "30-minute one-on-one consultation call",
      "Review and refine your cost estimate",
      "Material selection advice for your budget",
      "Contractor selection guidance",
      "Project timeline and milestone planning",
    ],
    includedIn: "Premium package (GHS 499)",
    ctaText: "Book Consultation — GHS 499",
  },
  {
    slug: "project-monitoring",
    title: "Project Monitoring",
    subtitle: "Track your construction project progress against budget and timeline",
    description:
      "Keep your construction project on track with our project monitoring tools. Track progress against your budget, monitor milestone completion, manage payments to contractors, and get alerts when costs exceed estimates. Includes monthly progress reports and budget health assessments.",
    benefits: [
      "Budget vs actual cost tracking dashboard",
      "Milestone completion monitoring",
      "Contractor payment management",
      "Cost overrun alerts and notifications",
      "Monthly progress reports",
    ],
    includedIn: "Premium package (GHS 499)",
    ctaText: "Get Project Monitoring — GHS 499",
  },
]

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug)
}
