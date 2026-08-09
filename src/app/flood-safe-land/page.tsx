"use client"

import { useState } from "react"
import Link from "next/link"
import { Droplets, MapPin, Shield, TrendingUp, Download, Mail, AlertTriangle, CheckCircle, Loader2, ChevronDown, Search, ArrowRight, type LucideIcon } from "lucide-react"

type FloodRisk = "critical" | "high" | "medium" | "low" | "safe"

type Location = {
  name: string
  risk: FloodRisk
  priceMin: number
  priceMax: number
  summary: string
  note: string
  safetyScore: number
  nadmoListed: boolean
  pricePerSqm: number
}

type RegionData = {
  name: string
  short: string
  tagline: string
  totalLocations: number
  priceRange: string
  locations: Location[]
}

const riskConfig: Record<FloodRisk, { label: string; color: string; bg: string; badge: string; icon: LucideIcon; pulse: string }> = {
  critical: { label: "Critical", color: "text-red-600", bg: "bg-red-50 border-red-300", badge: "bg-red-600 text-white", icon: AlertTriangle, pulse: "bg-red-400 animate-ping" },
  high: { label: "High Risk", color: "text-orange-600", bg: "bg-orange-50 border-orange-300", badge: "bg-orange-500 text-white", icon: Droplets, pulse: "bg-orange-400 animate-ping" },
  medium: { label: "Medium Risk", color: "text-amber-600", bg: "bg-amber-50 border-amber-300", badge: "bg-amber-500 text-white", icon: Droplets, pulse: "bg-amber-400 animate-ping" },
  low: { label: "Low Risk", color: "text-lime-600", bg: "bg-lime-50 border-lime-300", badge: "bg-lime-500 text-white", icon: Shield, pulse: "bg-lime-400 animate-ping" },
  safe: { label: "Safe Zone", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-300", badge: "bg-emerald-600 text-white", icon: CheckCircle, pulse: "bg-emerald-400 animate-ping" },
}

const regions: Record<string, RegionData> = {
  greaterAccra: {
    name: "Greater Accra Region",
    short: "Greater Accra",
    tagline: "The most flood-vulnerable region in Ghana — but safe pockets exist with strong investment potential",
    totalLocations: 42,
    priceRange: "GHS 7,000 – GHS 4.5M",
    locations: [
      { name: "Alajo", risk: "critical", priceMin: 350000, priceMax: 600000, pricePerSqm: 1200, summary: "Floods almost every rainy season. Located in the Odaw River drainage basin. Ground-floor properties near the Odaw channel are at extreme risk.", note: "NOT recommended for purchase without substantial drainage verification and significant price discount.", safetyScore: 1, nadmoListed: true },
      { name: "Nima / Nima Roundabout", risk: "critical", priceMin: 300000, priceMax: 500000, pricePerSqm: 1000, summary: "One of Accra's worst flood hotspots. Recurring flood events documented — over 52% of households cite weak enforcement as the cause.", note: "Avoid low-lying areas near the main drain. NADMO lists this as a critical flood-prone district.", safetyScore: 1, nadmoListed: true },
      { name: "Odawna / Kwame Nkrumah Circle", risk: "critical", priceMin: 400000, priceMax: 800000, pricePerSqm: 1500, summary: "Epicentre of Accra's flooding crisis. June 2026 floods submerged the entire area within hours. 16 roadblocks within 1km radius.", note: "Commercial value only — not for residential investment. Severe flood risk every rainy season.", safetyScore: 1, nadmoListed: true },
      { name: "Abossey Okai", risk: "critical", priceMin: 280000, priceMax: 500000, pricePerSqm: 1000, summary: "Low-lying area in the Kaneshie-Abossey Okai belt. Drainage infrastructure inadequate for current settlement density.", note: "High risk. Only consider with engineered drainage solutions and ground-floor elevation.", safetyScore: 2, nadmoListed: true },
      { name: "Kaneshie (Lorry Station / Market)", risk: "critical", priceMin: 350000, priceMax: 650000, pricePerSqm: 1200, summary: "Recurring flood zone. May 2025 — 132mm rain killed 4, displaced 3,000+. May 2026 — waist-deep floods again.", note: "Kaneshie Lorry Station area is one of the worst. Elevated areas on the ridge are safer.", safetyScore: 2, nadmoListed: true },
      { name: "Sakaman", risk: "critical", priceMin: 250000, priceMax: 450000, pricePerSqm: 900, summary: "Chronic flooding area. Natural drainage channels obstructed by unplanned construction.", note: "High risk of property damage. Not recommended without extensive drainage verification.", safetyScore: 2, nadmoListed: true },
      { name: "Mataheko", risk: "critical", priceMin: 280000, priceMax: 480000, pricePerSqm: 950, summary: "Floods most rainy seasons. Ground-floor properties at severe risk from runoff.", note: "Only consider upper-floor units or properties on elevated streets.", safetyScore: 2, nadmoListed: false },
      { name: "Glefe", risk: "critical", priceMin: 150000, priceMax: 350000, pricePerSqm: 700, summary: "Coastal wetland area — chronic flooding from both rain and tidal surges. Encroached wetland buffer zone.", note: "Severe flood risk. Wetland development is illegal and dangerous. Do not buy.", safetyScore: 1, nadmoListed: false },
      { name: "Sukura", risk: "critical", priceMin: 200000, priceMax: 400000, pricePerSqm: 800, summary: "Recurring flooding in this densely populated area. Poor drainage infrastructure.", note: "High risk. Avoid unless on elevated streets with proven drainage.", safetyScore: 2, nadmoListed: false },
      { name: "Russia", risk: "critical", priceMin: 180000, priceMax: 350000, pricePerSqm: 750, summary: "Notorious flood zone. Heavy rain leaves streets impassable. Part of the Odaw basin.", note: "Not recommended. Severe flooding documented every rainy season.", safetyScore: 1, nadmoListed: false },
      { name: "Weija / Gbawe", risk: "high", priceMin: 200000, priceMax: 450000, pricePerSqm: 850, summary: "Vulnerable due to presence of the Weija Dam. Downstream areas face rapid flooding when dam releases water. 511+ structures in buffer zones.", note: "Stick to elevated areas away from the Densu River. Check flood zone maps before buying.", safetyScore: 3, nadmoListed: true },
      { name: "Ga South (Weija Dam area)", risk: "high", priceMin: 180000, priceMax: 400000, pricePerSqm: 800, summary: "Weija Dam flashpoint. Dam spillages cause rapid, dangerous flooding in downstream communities.", note: "Only consider properties well above the dam's flood line. Consult NADMO flood maps.", safetyScore: 3, nadmoListed: true },
      { name: "Teshie Estate / Teshie Tafo", risk: "high", priceMin: 250000, priceMax: 500000, pricePerSqm: 950, summary: "NADMO-listed flood-prone areas in Ledzokuku district. Coastal location with drainage challenges.", note: "Elevated sections are safer. Check specific street elevation and proximity to lagoons.", safetyScore: 3, nadmoListed: true },
      { name: "Adabraka (North / Official Town)", risk: "high", priceMin: 400000, priceMax: 700000, pricePerSqm: 1400, summary: "Central Accra location with documented flood risk. Odawna overflow affects surrounding streets.", note: "Commercial/residential mixed. Upper-floor units OK. Ground-level flood risk is real.", safetyScore: 3, nadmoListed: true },
      { name: "Osu (Doku North / South / Alata)", risk: "high", priceMin: 450000, priceMax: 800000, pricePerSqm: 1600, summary: "NADMO-listed flood-prone areas in Korle Klottey. Low-lying sections near the lagoon flood regularly.", note: "Premium area but flood risk varies street-by-street. Elevation check essential before purchase.", safetyScore: 3, nadmoListed: true },
      { name: "Asylum Down", risk: "high", priceMin: 400000, priceMax: 700000, pricePerSqm: 1500, summary: "Central Accra — NADMO-listed flood-prone. Heavy rain overwhelms drainage in this area.", note: "Location is excellent but verify specific street drainage and elevation before committing.", safetyScore: 4, nadmoListed: true },
      { name: "Dansoman (lower sections)", risk: "medium", priceMin: 300000, priceMax: 600000, pricePerSqm: 1100, summary: "Lower sections near Densu Delta flood periodically. Upper Dansoman on the ridge is significantly lower risk.", note: "Upper Dansoman ridge is recommended. Lower sections need property-specific elevation assessment.", safetyScore: 5, nadmoListed: false },
      { name: "Abelemkpe", risk: "medium", priceMin: 500000, priceMax: 900000, pricePerSqm: 1800, summary: "Medium flood risk in heavy rain events. Well-connected area but some streets experience runoff.", note: "Good investment area — choose elevated streets. Verify drainage on specific plot.", safetyScore: 5, nadmoListed: false },
      { name: "Dzorwulu", risk: "medium", priceMin: 600000, priceMax: 1.1e6, pricePerSqm: 2000, summary: "Premium address with some flood risk in specific low-lying pockets. Well-drained on higher ground.", note: "Excellent investment — most of Dzorwulu is safe. Avoid the low-lying pockets near the stream.", safetyScore: 6, nadmoListed: false },
      { name: "Airport Residential (low pockets)", risk: "medium", priceMin: 1.5e6, priceMax: 3e6, pricePerSqm: 3800, summary: "Most of Airport Residential is elevated and safe, but specific low-lying pockets flood in extreme rain.", note: "Majority is excellent. Premium investment. Verify specific street elevation before buying.", safetyScore: 6, nadmoListed: false },
      { name: "East Legon (specific streets)", risk: "medium", priceMin: 1.1e6, priceMax: 2.2e6, pricePerSqm: 2800, summary: "Majority is LOW risk (elevated terrain) but specific lower-lying streets flood in heavy rain.", note: "Excellent investment — best value-for-safety in Accra. Check specific street drainage.", safetyScore: 7, nadmoListed: false },
      { name: "Achimota (lower areas)", risk: "medium", priceMin: 400000, priceMax: 750000, pricePerSqm: 1300, summary: "Mixed — elevated areas near the college are safe, lower areas near the stream have flood risk.", note: "Stick to elevated sections near Achimota School. Avoid low-lying areas near the stream.", safetyScore: 5, nadmoListed: false },
      { name: "Spintex Road (northern gated estates)", risk: "low", priceMin: 500000, priceMax: 1e6, pricePerSqm: 1800, summary: "Northern sections with engineered drainage in gated estates. Generally safe with isolated street-level ponding.", note: "Good investment. Northern gated estates have proper drainage. Southern sections more variable.", safetyScore: 8, nadmoListed: false },
      { name: "Cantonments", risk: "low", priceMin: 1.8e6, priceMax: 3.5e6, pricePerSqm: 3500, summary: "Premium Accra address. Elevated terrain, planned drainage, and well-maintained infrastructure.", note: "Excellent investment. Premium pricing but minimal flood risk. High resale value.", safetyScore: 9, nadmoListed: false },
      { name: "Airport Residential (majority)", risk: "low", priceMin: 1.8e6, priceMax: 3e6, pricePerSqm: 3800, summary: "Elevated terrain with good drainage. The most expensive land in Accra for good reason.", note: "Premium investment. Extremely scarce plots. Best flood safety in a central location.", safetyScore: 9, nadmoListed: false },
      { name: "East Legon (elevated sections)", risk: "low", priceMin: 1.2e6, priceMax: 2.2e6, pricePerSqm: 2800, summary: "The elevated heart of East Legon. High demand, strong rental potential, excellent safety record.", note: "Best value-for-safety in Accra's premium segment. Strong appreciation potential.", safetyScore: 9, nadmoListed: false },
      { name: "Tema Community 25", risk: "low", priceMin: 300000, priceMax: 600000, pricePerSqm: 950, summary: "TDA-planned community with engineered drainage. Flood-safe at 30-50% below equivalent Accra pricing.", note: "BEST flood-safe value in Greater Accra. Planned development, good infrastructure.", safetyScore: 9, nadmoListed: false },
      { name: "Sakumono", risk: "low", priceMin: 250000, priceMax: 500000, pricePerSqm: 850, summary: "Well-planned coastal community. Good drainage, safe from flooding. Emerging investment hotspot.", note: "Excellent flood-safe value. Growing rapidly with improving infrastructure.", safetyScore: 8, nadmoListed: false },
      { name: "Adenta", risk: "low", priceMin: 350000, priceMax: 700000, pricePerSqm: 1000, summary: "Higher elevation area with good drainage. Rapidly developing residential zone.", note: "Good investment. Affordable, safe, and growing. Check road access before purchase.", safetyScore: 8, nadmoListed: false },
      { name: "Dodowa", risk: "safe", priceMin: 200000, priceMax: 400000, pricePerSqm: 500, summary: "Lowest land prices in Greater Accra. Elevated terrain, minimal flood risk. Long-term growth play.", note: "Excellent entry-level investment. Patient capital required — infrastructure is developing.", safetyScore: 10, nadmoListed: false },
      { name: "Amasaman", risk: "safe", priceMin: 360000, priceMax: 720000, pricePerSqm: 900, summary: "Improving road connections to Accra. Affordable entry prices. Good long-term appreciation potential.", note: "Solid investment for patient buyers. Infrastructure improving — Accra-Nsawam corridor growth.", safetyScore: 9, nadmoListed: false },
      { name: "Prampram", risk: "safe", priceMin: 7000, priceMax: 250000, pricePerSqm: 400, summary: "Coastal town with growing popularity. Wide price range — from GHS 7,000 raw plots to GHS 250K serviced.", note: "Excellent value. Future development corridor. Verify land title carefully before purchase.", safetyScore: 8, nadmoListed: false },
      { name: "Oyibi", risk: "safe", priceMin: 150000, priceMax: 350000, pricePerSqm: 500, summary: "Developing area on the Accra plains. Good elevation, minimal flood risk. Affordable entry point.", note: "Good for long-term hold. Infrastructure developing slowly. Verify land documentation.", safetyScore: 9, nadmoListed: false },
      { name: "Afienya", risk: "safe", priceMin: 100000, priceMax: 300000, pricePerSqm: 400, summary: "Emerging residential area. Low land costs with growing demand from Accra's expansion eastward.", note: "Entry-level opportunity. Best for patient investors with 5+ year horizon.", safetyScore: 9, nadmoListed: false },
    ],
  },
  ashanti: {
    name: "Ashanti Region",
    short: "Ashanti",
    tagline: "Kumasi faces growing flood risk in key areas — but affordable safe land exists on the outskirts",
    totalLocations: 16,
    priceRange: "GHS 25,000 – GHS 1.2M",
    locations: [
      { name: "Aboabo / Asawase", risk: "critical", priceMin: 200000, priceMax: 400000, pricePerSqm: 500, summary: "Kumasi's worst flood zones. World Bank studies identify these as critical — Sisan, Wiwi and Aboabo river basins.", note: "Avoid. Government and World Bank have flagged these for urgent intervention.", safetyScore: 1, nadmoListed: true },
      { name: "Asafo Market area", risk: "high", priceMin: 300000, priceMax: 600000, pricePerSqm: 700, summary: "KMA Mayor inspected this area in June 2026 — choked drains and blocked waterways identified.", note: "Commercial area with severe drainage issues. Not for residential.", safetyScore: 2, nadmoListed: true },
      { name: "Atonsu / Kuwait", risk: "high", priceMin: 250000, priceMax: 450000, pricePerSqm: 550, summary: "8-year history of recurrent flooding from Atonsu and Sisa river overflow. Dredging started June 2026.", note: "Uncertain — monitor dredging results. Historically very flood-prone.", safetyScore: 2, nadmoListed: true },
      { name: "Nhyiaeso", risk: "low", priceMin: 600000, priceMax: 1.2e6, pricePerSqm: 1200, summary: "Kumasi's most expensive neighborhood. Elevated terrain, premium infrastructure, low flood risk.", note: "Premium investment. Best safety in Kumasi. Highest appreciation potential.", safetyScore: 8, nadmoListed: false },
      { name: "Ridge Kumasi", risk: "low", priceMin: 500000, priceMax: 1e6, pricePerSqm: 1000, summary: "Historic premium area with good elevation and drainage. Low flood risk.", note: "Excellent investment. Stable value, low risk, central location.", safetyScore: 8, nadmoListed: false },
      { name: "Ahodwo", risk: "low", priceMin: 400000, priceMax: 800000, pricePerSqm: 900, summary: "Premium Kumasi suburb with good drainage. Elevated terrain.", note: "Solid mid-premium investment. Good safety record.", safetyScore: 8, nadmoListed: false },
      { name: "KNUST corridor (Ayeduase)", risk: "medium", priceMin: 250000, priceMax: 500000, pricePerSqm: 600, summary: "High-growth area near KNUST. Student rental demand driving prices. Some drainage concerns.", note: "Good investment with strong rental yield. Check specific plot drainage.", safetyScore: 6, nadmoListed: false },
      { name: "Kentinkrono", risk: "low", priceMin: 200000, priceMax: 400000, pricePerSqm: 500, summary: "Growing residential area near KNUST. Improving infrastructure, low flood risk.", note: "Good mid-range investment. Strong appreciation from university demand.", safetyScore: 8, nadmoListed: false },
      { name: "Daban (near airport)", risk: "low", priceMin: 300000, priceMax: 600000, pricePerSqm: 700, summary: "Kumasi airport corridor. Rapidly developing, good elevation, low flood risk.", note: "Strong growth potential. Airport proximity drives value.", safetyScore: 8, nadmoListed: false },
      { name: "Asokwa", risk: "medium", priceMin: 250000, priceMax: 500000, pricePerSqm: 600, summary: "Central Kumasi location with mixed flood risk. Some areas near rivers flood.", note: "Choose elevated streets carefully. Central location is valuable.", safetyScore: 6, nadmoListed: false },
      { name: "Suame / Tafo Pankrono", risk: "medium", priceMin: 200000, priceMax: 400000, pricePerSqm: 500, summary: "Industrial/residential mixed area. Improving commute infrastructure. Variable flood risk.", note: "Affordable entry. Check proximity to drainage channels.", safetyScore: 5, nadmoListed: false },
      { name: "Tanoso", risk: "low", priceMin: 250000, priceMax: 500000, pricePerSqm: 600, summary: "Affordable Kumasi suburb near KNUST. Student rental demand. Good elevation.", note: "Good value investment. Infrastructure still developing but improving.", safetyScore: 8, nadmoListed: false },
      { name: "Ejisu", risk: "safe", priceMin: 120000, priceMax: 300000, pricePerSqm: 400, summary: "Kumasi outskirts. Very affordable land. Low flood risk. Long-term growth play.", note: "Excellent entry-level. Patient capital. Boankra Inland Port will drive growth.", safetyScore: 9, nadmoListed: false },
      { name: "Mampong (Kumasi outskirts)", risk: "safe", priceMin: 120000, priceMax: 280000, pricePerSqm: 350, summary: "Most affordable Kumasi-area land. Remote but very low flood risk.", note: "Long-term hold. Very low entry cost. Infrastructure will take time.", safetyScore: 10, nadmoListed: false },
      { name: "Boankra Corridor (east)", risk: "safe", priceMin: 150000, priceMax: 350000, pricePerSqm: 400, summary: "Upcoming Boankra Inland Port driving 10-15% faster price growth. Low flood risk.", note: "BEST growth potential in Ashanti Region. Inland port will transform this area.", safetyScore: 9, nadmoListed: false },
      { name: "Abuakwa", risk: "safe", priceMin: 200000, priceMax: 450000, pricePerSqm: 500, summary: "Rapidly developing greater Kumasi. Affordable land with increasing infrastructure investment.", note: "Good mid-range investment. Improving roads and utilities.", safetyScore: 9, nadmoListed: false },
    ],
  },
  central: {
    name: "Central Region",
    short: "Central",
    tagline: "Coastal flood risk near lagoons — Cape Coast hills offer safe, scenic alternatives",
    totalLocations: 10,
    priceRange: "GHS 10,000 – GHS 1.5M",
    locations: [
      { name: "Cape Coast (low-lying centre)", risk: "high", priceMin: 80000, priceMax: 200000, pricePerSqm: 800, summary: "Low-lying areas near the lagoon and coast flood during heavy rains and high tides.", note: "Stick to elevated areas on the hills. Avoid wetland-adjacent plots.", safetyScore: 3, nadmoListed: false },
      { name: "Cape Coast (hilltop/residential)", risk: "low", priceMin: 100000, priceMax: 280000, pricePerSqm: 1000, summary: "Elevated residential areas with ocean views. Good drainage and minimal flood risk.", note: "Excellent investment. Safe, scenic, strong tourism/rental potential.", safetyScore: 8, nadmoListed: false },
      { name: "Elmina (beachfront)", risk: "medium", priceMin: 200000, priceMax: 500000, pricePerSqm: 1200, summary: "Tourism hotspot. Some flood risk from tidal surges and lagoon overflow.", note: "Premium pricing for tourism value. Check elevation relative to sea level.", safetyScore: 5, nadmoListed: false },
      { name: "Kasoa", risk: "medium", priceMin: 20000, priceMax: 180000, pricePerSqm: 500, summary: "Accra fringe — rapid growth. Flood risk varies by specific location. Drainage improving.", note: "Good value. 45min to Accra. Choose elevated areas away from wetlands.", safetyScore: 5, nadmoListed: false },
      { name: "Winneba", risk: "medium", priceMin: 20000, priceMax: 60000, pricePerSqm: 350, summary: "Coastal town. Affordable land with tourism potential. Some coastal flood risk.", note: "Good for tourism investment. Avoid low-lying coastal strips.", safetyScore: 6, nadmoListed: false },
      { name: "Mankessim", risk: "low", priceMin: 10000, priceMax: 50000, pricePerSqm: 200, summary: "Commercial hub. Affordable land. Inland — lower flood risk than coast.", note: "Good entry-level. Commercial potential. Verify land title thoroughly.", safetyScore: 8, nadmoListed: false },
      { name: "Gomoa / Afransi", risk: "safe", priceMin: 8000, priceMax: 30000, pricePerSqm: 150, summary: "Rural inland area. Very affordable farmland. Minimal flood risk.", note: "Agricultural investment or long-term hold. Very cheap land.", safetyScore: 10, nadmoListed: false },
      { name: "Saltpond", risk: "low", priceMin: 15000, priceMax: 45000, pricePerSqm: 250, summary: "Historic town. Affordable land with improving road access. Low flood risk.", note: "Good value. Patience required — development is slower than Accra fringe.", safetyScore: 8, nadmoListed: false },
      { name: "Sekondi-Takoradi corridor", risk: "medium", priceMin: 50000, priceMax: 150000, pricePerSqm: 500, summary: "Western corridor connecting to Central region. Mixed flood risk — check specific location.", note: "Oil city growth spillover. Good investment near the highway.", safetyScore: 6, nadmoListed: false },
      { name: "Kwanyako / Bawjiase", risk: "safe", priceMin: 10000, priceMax: 25000, pricePerSqm: 150, summary: "Inland agricultural areas. Very affordable. No flood risk. Long-term land banking.", note: "Land banking play. Wait for Accra expansion to reach here (10+ year horizon).", safetyScore: 10, nadmoListed: false },
    ],
  },
  eastern: {
    name: "Eastern Region",
    short: "Eastern",
    tagline: "Hilly terrain offers natural flood protection — premium hilltop locations emerging",
    totalLocations: 8,
    priceRange: "GHS 15,000 – GHS 500,000",
    locations: [
      { name: "Nsawam", risk: "low", priceMin: 50000, priceMax: 150000, pricePerSqm: 400, summary: "Accra-Nsawam corridor. Industrial/commercial growth. Low flood risk.", note: "Good investment along the corridor. Industrial land values rising.", safetyScore: 8, nadmoListed: false },
      { name: "Koforidua (town centre)", risk: "medium", priceMin: 80000, priceMax: 200000, pricePerSqm: 500, summary: "Regional capital. Some drainage concerns in older parts of town.", note: "Stick to newer developed areas with proper drainage.", safetyScore: 6, nadmoListed: false },
      { name: "Koforidua (hilltop/new areas)", risk: "low", priceMin: 100000, priceMax: 250000, pricePerSqm: 600, summary: "New residential developments on elevated terrain. Good drainage.", note: "Good investment. Growing regional capital with improving infrastructure.", safetyScore: 8, nadmoListed: false },
      { name: "Akosombo", risk: "low", priceMin: 45000, priceMax: 70000, pricePerSqm: 350, summary: "Volta Lake town. Scenic location. Low flood risk away from the lake edge.", note: "Tourism potential. Good for vacation property. Check specific lake proximity.", safetyScore: 8, nadmoListed: false },
      { name: "Aburi / Peduase", risk: "safe", priceMin: 100000, priceMax: 300000, pricePerSqm: 700, summary: "Hills — naturally flood-safe. Premium mountain views. Cool climate.", note: "Excellent investment. Scenic, safe, prestigious. Strong diaspora demand.", safetyScore: 10, nadmoListed: false },
      { name: "Akwapim Ridge", risk: "safe", priceMin: 80000, priceMax: 250000, pricePerSqm: 600, summary: "Mountain ridge — the safest terrain in Ghana for flood avoidance. Stunning views.", note: "PREMIUM flood-safe investment. Rising demand from diaspora buyers.", safetyScore: 10, nadmoListed: false },
      { name: "Suhum", risk: "low", priceMin: 30000, priceMax: 80000, pricePerSqm: 250, summary: "Agricultural town. Affordable land. Low flood risk.", note: "Entry-level. Good for farming or long-term hold.", safetyScore: 9, nadmoListed: false },
      { name: "Bunso / Anyinam", risk: "safe", priceMin: 20000, priceMax: 60000, pricePerSqm: 200, summary: "Deep Eastern region. Very affordable. Forested hills — naturally drained.", note: "Very cheap. Good for agricultural investment or land banking.", safetyScore: 10, nadmoListed: false },
    ],
  },
  volta: {
    name: "Volta Region",
    short: "Volta",
    tagline: "Volta Lake flood risk — but the hinterland hills are some of Ghana's safest",
    totalLocations: 6,
    priceRange: "GHS 10,000 – GHS 300,000",
    locations: [
      { name: "Ho (town centre)", risk: "medium", priceMin: 60000, priceMax: 150000, pricePerSqm: 400, summary: "Regional capital. Growing quickly. Some drainage issues in lower areas.", note: "Good regional investment. Choose elevated sections.", safetyScore: 6, nadmoListed: false },
      { name: "Volta Lake shoreline", risk: "high", priceMin: 30000, priceMax: 100000, pricePerSqm: 300, summary: "Dam spillage and lake level rise cause periodic flooding. NADMO-listed high risk.", note: "Avoid. Dam operations create unpredictable flood risk.", safetyScore: 2, nadmoListed: true },
      { name: "Keta (coastal strip)", risk: "critical", priceMin: 40000, priceMax: 120000, pricePerSqm: 350, summary: "Coastal erosion + sea level rise = double threat. Keta is one of Ghana's most vulnerable areas.", note: "NOT recommended. Severe erosion and flood risk. Keta Sea Defence project ongoing.", safetyScore: 1, nadmoListed: false },
      { name: "Amedzofe / Hohoe (hills)", risk: "safe", priceMin: 20000, priceMax: 60000, pricePerSqm: 200, summary: "Mountain terrain — naturally flood-safe. Cool climate, scenic landscapes.", note: "Excellent for eco-tourism or retirement property. Very safe.", safetyScore: 10, nadmoListed: false },
      { name: "Akatsi", risk: "low", priceMin: 15000, priceMax: 40000, pricePerSqm: 150, summary: "Inland town. Affordable land. Low flood risk.", note: "Entry-level investment. Patient capital required.", safetyScore: 8, nadmoListed: false },
      { name: "Dzodze / Penyi", risk: "safe", priceMin: 10000, priceMax: 30000, pricePerSqm: 120, summary: "Rural Volta. Very cheap land. No flood risk. Agricultural heartland.", note: "Land banking. Very long-term. Only for agricultural investors.", safetyScore: 10, nadmoListed: false },
    ],
  },
}

const regionKeys = Object.keys(regions)
const riskOrder: FloodRisk[] = ["critical", "high", "medium", "low", "safe"]

export default function FloodSafeLandPage() {
  const [region, setRegion] = useState("greaterAccra")
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [filterRisk, setFilterRisk] = useState<FloodRisk | "all">("all")

  const data = regions[region]
  const filtered = data.locations
    .filter((l) => filterRisk === "all" || l.risk === filterRisk)
    .filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.includes("@") || !phone.trim()) return
    setStatus("loading")
    try {
      const res = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, phone: phone.trim(), source: "flood-safe-land" }),
      })
      if (res.ok) {
        setStatus("success")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  const riskCounts = riskOrder.map((r) => ({
    risk: r,
    count: data.locations.filter((l) => l.risk === r).length,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            <span>Lead Magnet &bull; Free Intelligence Report</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white max-w-3xl leading-tight">
            Know Where to Buy Land in Ghana
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-100"> Before the Rains Come</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-100/70 max-w-2xl mt-4">
            Interactive flood risk intelligence for every region in Ghana. Backed by NADMO data, research studies, and live market pricing.
            <strong className="text-white font-semibold"> Greater Accra includes 42 locations rated from Critical to Safe.</strong>
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-10 max-w-3xl">
            {[
              { value: "16", label: "Regions Mapped", icon: MapPin },
              { value: "82+", label: "Locations Analysed", icon: Search },
              { value: "10+", label: "Research Sources", icon: TrendingUp },
              { value: "Free", label: "Always Free Access", icon: Shield },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10 text-center">
                <s.icon className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-xl md:text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-emerald-200/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RISK LEGEND ── */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase">Risk Legend:</span>
            {(riskOrder as FloodRisk[]).map((r) => {
              const cfg = riskConfig[r]
              return (
                <button key={r} onClick={() => setFilterRisk(filterRisk === r ? "all" : r)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  filterRisk === r ? "ring-2 ring-offset-1 " + cfg.bg : "bg-white " + cfg.bg
                }`}>
                  <span className={`w-2 h-2 rounded-full ${r === "critical" ? "bg-red-500" : r === "high" ? "bg-orange-500" : r === "medium" ? "bg-amber-500" : r === "low" ? "bg-lime-500" : "bg-emerald-500"}`} />
                  {cfg.label}
                </button>
              )
            })}
            {filterRisk !== "all" && (
              <button onClick={() => setFilterRisk("all")} className="text-xs text-slate-400 hover:text-slate-600 underline">
                Clear filter
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="container mx-auto px-4 py-8">
        {/* Region Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {regionKeys.map((rk) => (
            <button key={rk} onClick={() => { setRegion(rk); setFilterRisk("all") }} className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              region === rk
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
            }`}>
              {regions[rk].name}
            </button>
          ))}
        </div>

        {/* Region Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-6 md:p-8 text-white mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold">{data.name}</h2>
              <p className="text-emerald-100/80 mt-1 max-w-2xl">{data.tagline}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center bg-white/10 rounded-xl px-4 py-2 border border-white/10">
                <div className="text-lg font-bold">{data.totalLocations}</div>
                <div className="text-xs text-emerald-200/80">Locations</div>
              </div>
              <div className="text-center bg-white/10 rounded-xl px-4 py-2 border border-white/10">
                <div className="text-lg font-bold">{data.priceRange}</div>
                <div className="text-xs text-emerald-200/80">Price Range</div>
              </div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
            {riskCounts.map((rc) => {
              const cfg = riskConfig[rc.risk]
              const pct = data.locations.length > 0 ? Math.round((rc.count / data.locations.length) * 100) : 0
              return (
                <div key={rc.risk} className="flex items-center gap-1.5 text-xs">
                  <div className={`w-2 h-2 rounded-full ${rc.risk === "critical" ? "bg-red-400" : rc.risk === "high" ? "bg-orange-400" : rc.risk === "medium" ? "bg-amber-400" : rc.risk === "low" ? "bg-lime-400" : "bg-emerald-400"}`} />
                  <span className="text-emerald-100/70">{rc.count}</span>
                  <span className="text-emerald-200/50">{cfg.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>

        {/* Location Cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>No locations match your filter. Try a different search or risk level.</p>
            </div>
          )}
          {filtered.map((loc) => {
            const cfg = riskConfig[loc.risk]
            const Icon = cfg.icon
            return (
              <div key={loc.name} className={`rounded-2xl border-2 transition-all hover:shadow-md ${cfg.bg}`}>
                <div className="p-5 md:p-6">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        loc.risk === "critical" ? "bg-red-100 text-red-600" :
                        loc.risk === "high" ? "bg-orange-100 text-orange-600" :
                        loc.risk === "medium" ? "bg-amber-100 text-amber-600" :
                        loc.risk === "low" ? "bg-lime-100 text-lime-600" :
                        "bg-emerald-100 text-emerald-600"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-lg">{loc.name}</h3>
                          {loc.nadmoListed && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase tracking-wider">NADMO Listed</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{loc.summary}</p>
                      </div>
                    </div>
                    <div className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white text-center whitespace-nowrap ${cfg.badge}`}>
                      {cfg.label}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-inherit">
                    {/* Flood Risk Gauge */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Flood Risk Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            loc.safetyScore <= 2 ? "bg-red-500" :
                            loc.safetyScore <= 4 ? "bg-orange-500" :
                            loc.safetyScore <= 6 ? "bg-amber-500" :
                            loc.safetyScore <= 8 ? "bg-lime-500" :
                            "bg-emerald-500"
                          }`} style={{ width: `${loc.safetyScore * 10}%` }} />
                        </div>
                        <span className={`text-sm font-bold ${
                          loc.safetyScore <= 2 ? "text-red-600" :
                          loc.safetyScore <= 4 ? "text-orange-600" :
                          loc.safetyScore <= 6 ? "text-amber-600" :
                          loc.safetyScore <= 8 ? "text-lime-600" :
                          "text-emerald-600"
                        }`}>{loc.safetyScore}/10</span>
                      </div>
                    </div>

                    {/* Land Price */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Land Price Range</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>GHS {loc.priceMin.toLocaleString()}</span>
                            <span>GHS {loc.priceMax.toLocaleString()}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500/60" style={{ width: "60%" }} />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">~GHS {loc.pricePerSqm}/sqm</p>
                    </div>

                    {/* Buyer Note */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Buyer Guidance</p>
                      <p className="text-sm text-slate-700">{loc.note}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── EMAIL CAPTURE ── */}
      <section className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 py-16 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700/50 flex items-center justify-center mx-auto mb-6 border border-emerald-600/30">
            <Download className="h-8 w-8 text-emerald-300" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
            Get the Complete Flood Risk Report
          </h2>
          <p className="text-emerald-100/70 mb-8">
            Enter your email to receive the full 16-region flood risk intelligence report with detailed pricing, NADMO data, and investment recommendations — delivered free to your inbox.
          </p>

          {status === "success" ? (
            <div className="bg-emerald-700/30 border border-emerald-600/30 rounded-xl p-6">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-white font-bold text-lg">You&apos;re in! Your report is ready.</p>
              <p className="text-emerald-200/80 text-sm mt-1 mb-5">Click below to view your complete flood risk intelligence report.</p>
              <a
                href="/reports/flood-risk"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all shadow-lg"
              >
                <Download className="h-4 w-4" /> View Your Free Report
              </a>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="max-w-lg mx-auto space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-emerald-600/30 text-white placeholder:text-emerald-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-emerald-600/30 text-white placeholder:text-emerald-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-emerald-600/30 text-white placeholder:text-emerald-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Download className="h-4 w-4" /> Get My Free Report</>
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-emerald-300/40 mt-4">No spam. Unsubscribe anytime. We respect your inbox.</p>
        </div>
      </section>

      {/* ── FOOTNOTE ── */}
      <section className="bg-slate-50 border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              <strong className="text-slate-600">Disclaimer:</strong> Flood risk data compiled from NADMO reports, GARID Project data, World Bank studies, academic research (UCC, KNUST, University of Ghana), and media reports as of July 2026. Land prices are market estimates based on listings from Ghana Property Centre, Meqasa, Lamudi, Jiji, and real estate publications. This is not financial or legal advice. Always verify land title at the Lands Commission, conduct a physical inspection, and engage a licensed surveyor before purchase.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
