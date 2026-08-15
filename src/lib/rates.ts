export const GRADE_BASELINES: Record<string, { min: number; max: number }> = {
  basic: { min: 400000, max: 650000 },
  standard: { min: 650000, max: 1000000 },
  premium: { min: 1000000, max: 1500000 },
}

const round5k = (n: number) => Math.round(n / 5000) * 5000

export function estimateFor(multiplier: number, grade = "standard") {
  const base = GRADE_BASELINES[grade] ?? GRADE_BASELINES.standard
  return {
    min: round5k(base.min * multiplier),
    max: round5k(base.max * multiplier),
  }
}

export function fmtGhs(n: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(n)
}

export const RATE_LABELS: { key: keyof RegionRateLike; label: string; unit: string }[] = [
  { key: "cementBag", label: "Cement (50kg)", unit: "per bag" },
  { key: "rebarTon", label: "Iron rods / rebar", unit: "per tonne" },
  { key: "block", label: "Sandcrete block", unit: "per block" },
  { key: "sandTrip", label: "Sand", unit: "per tipper trip" },
  { key: "graniteTrip", label: "Granite / chippings", unit: "per tipper trip" },
  { key: "timber", label: "Timber", unit: "per standard length" },
  { key: "roofingSqm", label: "Roofing sheets", unit: "per SQM installed" },
  { key: "dieselLit", label: "Diesel", unit: "per litre" },
  { key: "paintLit", label: "Paint", unit: "per litre" },
]

type RegionRateLike = {
  cementBag: number
  rebarTon: number
  block: number
  sandTrip: number
  graniteTrip: number
  timber: number
  roofingSqm: number
  dieselLit: number
  paintLit: number
}
