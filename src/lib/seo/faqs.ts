export interface Faq {
  q: string
  a: string
}

export const homepageFaqs: Faq[] = [
  {
    q: "How much does it cost to build a house in Ghana?",
    a: "A typical 3-bedroom house in Ghana costs between GHS 450,000 and GHS 1.2 million (roughly USD 30,000 to 80,000), depending on location, size, and finishing grade. Costs are highest in Accra and other regional capitals, and lower in rural areas. Use the free BuildCost GH calculator for a personalized estimate.",
  },
  {
    q: "How does the BuildCost GH calculator work?",
    a: "Enter your project details — bedrooms, floor area, location, finishing grade, and add-ons — and our engine estimates costs from real Ghana market data covering material prices and labor rates across all 16 regions. You get an instant itemized estimate, no credit card required.",
  },
  {
    q: "Is BuildCost GH free to use?",
    a: "Yes. The basic cost estimate is completely free and gives you an instant breakdown with region comparison. Paid reports add itemized material quantities, Excel spreadsheets, contractor contacts, and consultations.",
  },
  {
    q: "Is BuildCost GH suitable for the diaspora building in Ghana?",
    a: "Absolutely. BuildCost GH is built for Ghanaians and the African diaspora planning to build or invest in Ghana from abroad. It provides current Ghana market costs in GHS and USD, region-specific pricing, and vetted contractor contacts so you can plan remotely with confidence.",
  },
  {
    q: "How accurate are the estimates?",
    a: "Estimates are based on real market data updated monthly from suppliers, contractors, and research across Ghana. Users report estimates within 5% of contractor quotes. Final costs depend on site conditions and material choices, so we recommend a Detailed report for budgeting and contractor comparison.",
  },
  {
    q: "What types of buildings can I estimate?",
    a: "The calculator supports residential projects — 2 to 6 bedroom houses, storey buildings, bungalows, and apartments — with options for pools, gardens, security, and solar. For commercial or multi-unit projects, contact us for a custom quote.",
  },
]

export const pricingFaqs: Faq[] = [
  {
    q: "What exactly is included in the report?",
    a: "Each report includes a comprehensive breakdown of construction costs based on your specific project details. The Basic package includes a PDF summary, while Detailed and Premium include editable Excel files with full material quantities.",
  },
  {
    q: "How quickly will I receive my report?",
    a: "Basic reports are delivered instantly via email. Detailed reports within 2 hours. Premium reports include a consultation call scheduled within 24 hours, with the report delivered within 2 hours of booking.",
  },
  {
    q: "Can I get a refund if I'm not satisfied?",
    a: "Absolutely! We offer a 7-day money-back guarantee. If you're not satisfied with your report, we'll refund your full purchase — no questions asked.",
  },
  {
    q: "Is there a free version?",
    a: "Yes! Our Free Trial gives you an instant cost estimate with a breakdown chart and region comparison — no credit card required. Try the calculator and see how it works before you buy a full report.",
  },
  {
    q: "Can I pay with Mobile Money?",
    a: "Yes! Paystack accepts all major Ghanaian mobile money wallets — MTN MoMo, Vodafone Cash, and AirtelTigo Money. You can also pay with Visa and Mastercard. When you click buy, you will be redirected to Paystack where you can choose your preferred payment method.",
  },
  {
    q: "Do you offer custom quotes for commercial projects?",
    a: "Yes! Contact us directly for commercial construction cost estimation. Our team can handle multi-unit developments, commercial buildings, and industrial projects.",
  },
  {
    q: "How is the cost data updated?",
    a: "We update our cost database monthly using data from suppliers, contractors, and market research across all 16 regions of Ghana.",
  },
  {
    q: "What's the difference between one-time reports and subscriptions?",
    a: "One-time reports are single purchases — you pay once for a detailed report. Subscriptions give you unlimited access: monthly or annual plans with unlimited basic estimates, PDF reports, and tools.",
  },
  {
    q: "Can I switch from monthly to annual?",
    a: "Yes! You can upgrade from Monthly to Annual anytime. The remaining monthly balance is prorated toward your annual plan.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Absolutely. Cancel anytime from your account dashboard. Your access continues until the end of the billing period. No cancellation fees.",
  },
]

export const calculatorFaqs: Faq[] = [
  {
    q: "How much does it cost to build a 3-bedroom house in Ghana?",
    a: "A 3-bedroom house in Ghana typically costs between GHS 450,000 and GHS 1.2 million depending on location, floor area, and finishing grade. In Accra expect the higher end of that range. Use this calculator to get a precise, itemized estimate for your specific project.",
  },
  {
    q: "Which regions does the calculator cover?",
    a: "All 16 regions of Ghana, including Greater Accra, Ashanti, Western, Eastern, Central, Volta, and the Northern regions. Estimates automatically adjust for regional differences in material and labor costs.",
  },
  {
    q: "What finishing grades are available?",
    a: "Grade A (high-end finishes), Grade B (standard modern finishes), and Grade C (economical finishes). Each grade changes material quality and per-square-metre cost, and the calculator shows the price difference between them.",
  },
  {
    q: "What additional features can I add?",
    a: "You can add a swimming pool, garden landscaping, perimeter wall and gate, security system, solar panels, borehole, and more. Each add-on is priced using current Ghana market rates.",
  },
  {
    q: "Can I use the estimate for bank or mortgage applications?",
    a: "Yes — many users present our Detailed report to banks, SSNIT, and other lenders. For formal use, we recommend upgrading to a Detailed or Premium report, which includes itemized material quantities and professional formatting.",
  },
]

export const affiliatesFaqs: Faq[] = [
  {
    q: "Who can join?",
    a: "Anyone with an audience interested in construction or real estate in Ghana — bloggers, YouTubers, real estate agents, diaspora community leaders, and social media influencers.",
  },
  {
    q: "How and when do I get paid?",
    a: "Commissions are paid monthly via Mobile Money (MTN, Vodafone, AirtelTigo), bank transfer, or PayPal. Minimum payout is GHS 100.",
  },
  {
    q: "How are referrals tracked?",
    a: "You get a unique referral link. When someone clicks your link and makes a purchase within 30 days, the sale is attributed to you.",
  },
]

export function getLlmFaqs(): Faq[] {
  return [
    homepageFaqs[0],
    homepageFaqs[1],
    homepageFaqs[2],
    homepageFaqs[4],
    calculatorFaqs[0],
    calculatorFaqs[1],
    pricingFaqs[4],
    pricingFaqs[2],
  ]
}
