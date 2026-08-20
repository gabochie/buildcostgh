import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type QualityLevel = 'economy' | 'standard' | 'premium'
const QUALITY_MULT: Record<QualityLevel, number> = { economy: 0.7, standard: 1.0, premium: 1.6 }

type Elemental = {
  substructurePct: number; framePct: number; upperFloorsPct: number; roofPct: number
  externalWallsPct: number; windowsDoorsPct: number; internalFinishesPct: number
  externalFinishesPct: number; fittingsPct: number; mechanicalPct: number
  electricalPct: number; fireProtectionPct: number
}

type CategoryDef = {
  name: string; slug: string; description: string; icon: string; sortOrder: number
  subtypes: { name: string; slug: string; complexity: string; min: number; max: number }[]
  baseRate: number; elemental: Elemental
  profFees?: Partial<{ architectFeePct: number; qsFeePct: number; structuralEngFeePct: number; civilEngFeePct: number; mechanicalEngFeePct: number; electricalEngFeePct: number; geotechFeePct: number; pmFeePct: number }>
}

const CATEGORIES: CategoryDef[] = [
  {
    name: 'Residential', slug: 'residential', icon: 'home', sortOrder: 1,
    description: 'Houses, apartments, flats, and residential developments',
    baseRate: 2200,
    elemental: { substructurePct: 0.12, framePct: 0.18, upperFloorsPct: 0.10, roofPct: 0.10, externalWallsPct: 0.08, windowsDoorsPct: 0.07, internalFinishesPct: 0.15, externalFinishesPct: 0.04, fittingsPct: 0.03, mechanicalPct: 0.05, electricalPct: 0.05, fireProtectionPct: 0.01 },
    subtypes: [
      { name: 'Single-Family House', slug: 'single-family-house', complexity: 'standard', min: 1, max: 3 },
      { name: 'Semi-Detached House', slug: 'semi-detached-house', complexity: 'standard', min: 1, max: 3 },
      { name: 'Detached House', slug: 'detached-house', complexity: 'standard', min: 1, max: 4 },
      { name: 'Townhouse', slug: 'townhouse', complexity: 'standard', min: 2, max: 4 },
      { name: 'Villa', slug: 'villa', complexity: 'high', min: 1, max: 3 },
      { name: 'Mansion / High-End Residence', slug: 'mansion', complexity: 'very_high', min: 1, max: 4 },
      { name: 'Apartment Building', slug: 'apartment-building', complexity: 'high', min: 2, max: 10 },
      { name: 'Flats', slug: 'flats', complexity: 'standard', min: 2, max: 6 },
      { name: 'Condominium', slug: 'condominium', complexity: 'high', min: 3, max: 15 },
      { name: 'Student Accommodation', slug: 'student-accommodation', complexity: 'standard', min: 2, max: 6 },
      { name: 'Affordable Housing', slug: 'affordable-housing', complexity: 'low', min: 1, max: 4 },
      { name: 'Social Housing', slug: 'social-housing', complexity: 'low', min: 1, max: 4 },
      { name: 'Serviced Apartment', slug: 'serviced-apartment', complexity: 'high', min: 3, max: 10 },
      { name: 'Mixed Residential Development', slug: 'mixed-residential', complexity: 'high', min: 2, max: 12 },
    ],
  },
  {
    name: 'Commercial', slug: 'commercial', icon: 'building-2', sortOrder: 2,
    description: 'Offices, retail, shopping centres, and business premises',
    baseRate: 3200,
    elemental: { substructurePct: 0.10, framePct: 0.20, upperFloorsPct: 0.12, roofPct: 0.08, externalWallsPct: 0.08, windowsDoorsPct: 0.06, internalFinishesPct: 0.13, externalFinishesPct: 0.03, fittingsPct: 0.03, mechanicalPct: 0.08, electricalPct: 0.07, fireProtectionPct: 0.02 },
    subtypes: [
      { name: 'Office Building', slug: 'office-building', complexity: 'high', min: 2, max: 15 },
      { name: 'Corporate Headquarters', slug: 'corporate-headquarters', complexity: 'very_high', min: 3, max: 20 },
      { name: 'Small Office', slug: 'small-office', complexity: 'standard', min: 1, max: 3 },
      { name: 'Retail Shop', slug: 'retail-shop', complexity: 'low', min: 1, max: 2 },
      { name: 'Shopping Centre', slug: 'shopping-centre', complexity: 'high', min: 1, max: 4 },
      { name: 'Shopping Mall', slug: 'shopping-mall', complexity: 'very_high', min: 2, max: 5 },
      { name: 'Supermarket', slug: 'supermarket', complexity: 'standard', min: 1, max: 2 },
      { name: 'Mixed-Use Commercial', slug: 'mixed-use-commercial', complexity: 'high', min: 3, max: 12 },
      { name: 'Restaurant', slug: 'restaurant', complexity: 'standard', min: 1, max: 3 },
      { name: 'Business Centre', slug: 'business-centre', complexity: 'standard', min: 2, max: 6 },
      { name: 'Showroom', slug: 'showroom', complexity: 'standard', min: 1, max: 2 },
      { name: 'Bank Branch', slug: 'bank-branch', complexity: 'high', min: 1, max: 3 },
      { name: 'Commercial Complex', slug: 'commercial-complex', complexity: 'very_high', min: 3, max: 15 },
    ],
  },
  {
    name: 'Hospitality', slug: 'hospitality', icon: 'hotel', sortOrder: 3,
    description: 'Hotels, guesthouses, resorts, and event venues',
    baseRate: 3800,
    elemental: { substructurePct: 0.10, framePct: 0.18, upperFloorsPct: 0.10, roofPct: 0.08, externalWallsPct: 0.07, windowsDoorsPct: 0.06, internalFinishesPct: 0.16, externalFinishesPct: 0.04, fittingsPct: 0.04, mechanicalPct: 0.09, electricalPct: 0.06, fireProtectionPct: 0.02 },
    profFees: { mechanicalEngFeePct: 0.03, electricalEngFeePct: 0.03 },
    subtypes: [
      { name: 'Guesthouse', slug: 'guesthouse', complexity: 'standard', min: 1, max: 3 },
      { name: 'Lodge', slug: 'lodge', complexity: 'high', min: 1, max: 2 },
      { name: 'Hotel', slug: 'hotel', complexity: 'very_high', min: 3, max: 20 },
      { name: 'Boutique Hotel', slug: 'boutique-hotel', complexity: 'high', min: 2, max: 6 },
      { name: 'Business Hotel', slug: 'business-hotel', complexity: 'high', min: 4, max: 15 },
      { name: 'Resort', slug: 'resort', complexity: 'very_high', min: 1, max: 5 },
      { name: 'Hostel', slug: 'hostel', complexity: 'standard', min: 2, max: 5 },
      { name: 'Conference Centre', slug: 'conference-centre', complexity: 'high', min: 1, max: 3 },
      { name: 'Event Centre', slug: 'event-centre', complexity: 'high', min: 1, max: 2 },
    ],
  },
  {
    name: 'Healthcare', slug: 'healthcare', icon: 'heart-pulse', sortOrder: 4,
    description: 'Hospitals, clinics, laboratories, and medical facilities',
    baseRate: 4200,
    elemental: { substructurePct: 0.10, framePct: 0.18, upperFloorsPct: 0.10, roofPct: 0.08, externalWallsPct: 0.07, windowsDoorsPct: 0.05, internalFinishesPct: 0.14, externalFinishesPct: 0.03, fittingsPct: 0.03, mechanicalPct: 0.10, electricalPct: 0.08, fireProtectionPct: 0.04 },
    profFees: { architectFeePct: 0.10, structuralEngFeePct: 0.06, mechanicalEngFeePct: 0.03, electricalEngFeePct: 0.03 },
    subtypes: [
      { name: 'Clinic', slug: 'clinic', complexity: 'standard', min: 1, max: 2 },
      { name: 'Medical Centre', slug: 'medical-centre', complexity: 'high', min: 2, max: 5 },
      { name: 'Polyclinic', slug: 'polyclinic', complexity: 'high', min: 2, max: 4 },
      { name: 'Hospital', slug: 'hospital', complexity: 'very_high', min: 3, max: 10 },
      { name: 'Specialist Hospital', slug: 'specialist-hospital', complexity: 'very_high', min: 3, max: 8 },
      { name: 'Diagnostic Centre', slug: 'diagnostic-centre', complexity: 'high', min: 1, max: 3 },
      { name: 'Laboratory', slug: 'laboratory', complexity: 'high', min: 1, max: 3 },
      { name: 'Pharmacy', slug: 'pharmacy', complexity: 'low', min: 1, max: 1 },
      { name: 'Dental Clinic', slug: 'dental-clinic', complexity: 'standard', min: 1, max: 2 },
      { name: 'Maternity Facility', slug: 'maternity-facility', complexity: 'standard', min: 1, max: 3 },
      { name: 'Rehabilitation Centre', slug: 'rehabilitation-centre', complexity: 'standard', min: 1, max: 3 },
    ],
  },
  {
    name: 'Education', slug: 'education', icon: 'graduation-cap', sortOrder: 5,
    description: 'Schools, universities, libraries, and training facilities',
    baseRate: 2800,
    elemental: { substructurePct: 0.12, framePct: 0.20, upperFloorsPct: 0.12, roofPct: 0.10, externalWallsPct: 0.08, windowsDoorsPct: 0.06, internalFinishesPct: 0.13, externalFinishesPct: 0.04, fittingsPct: 0.03, mechanicalPct: 0.05, electricalPct: 0.05, fireProtectionPct: 0.02 },
    profFees: { architectFeePct: 0.10, structuralEngFeePct: 0.06 },
    subtypes: [
      { name: 'Nursery / Kindergarten', slug: 'nursery-kindergarten', complexity: 'low', min: 1, max: 2 },
      { name: 'Basic School (Primary)', slug: 'basic-school', complexity: 'standard', min: 1, max: 3 },
      { name: 'Junior High School', slug: 'junior-high-school', complexity: 'standard', min: 1, max: 3 },
      { name: 'Senior High School', slug: 'senior-high-school', complexity: 'high', min: 1, max: 4 },
      { name: 'Vocational / Technical School', slug: 'vocational-school', complexity: 'high', min: 1, max: 3 },
      { name: 'Training Centre', slug: 'training-centre', complexity: 'standard', min: 1, max: 3 },
      { name: 'University Building', slug: 'university-building', complexity: 'very_high', min: 2, max: 8 },
      { name: 'Lecture Hall', slug: 'lecture-hall', complexity: 'standard', min: 1, max: 3 },
      { name: 'School Laboratory', slug: 'school-laboratory', complexity: 'high', min: 1, max: 3 },
      { name: 'Library', slug: 'library', complexity: 'standard', min: 1, max: 3 },
      { name: 'Student Accommodation (Institutional)', slug: 'student-housing-inst', complexity: 'standard', min: 2, max: 6 },
      { name: 'Administrative Building (Education)', slug: 'education-admin', complexity: 'standard', min: 1, max: 4 },
      { name: 'Research Facility', slug: 'research-facility', complexity: 'very_high', min: 2, max: 5 },
    ],
  },
  {
    name: 'Institutional / Civic', slug: 'institutional', icon: 'landmark', sortOrder: 6,
    description: 'Government buildings, civic centres, and public facilities',
    baseRate: 3000,
    elemental: { substructurePct: 0.10, framePct: 0.20, upperFloorsPct: 0.12, roofPct: 0.08, externalWallsPct: 0.08, windowsDoorsPct: 0.06, internalFinishesPct: 0.14, externalFinishesPct: 0.04, fittingsPct: 0.03, mechanicalPct: 0.06, electricalPct: 0.06, fireProtectionPct: 0.03 },
    subtypes: [
      { name: 'Government Office', slug: 'government-office', complexity: 'standard', min: 1, max: 6 },
      { name: 'District / Municipal Assembly', slug: 'mmda-building', complexity: 'high', min: 2, max: 5 },
      { name: 'Ministry / Agency Building', slug: 'ministry-building', complexity: 'very_high', min: 3, max: 10 },
      { name: 'Courthouse', slug: 'courthouse', complexity: 'very_high', min: 2, max: 5 },
      { name: 'Police Station', slug: 'police-station', complexity: 'standard', min: 1, max: 3 },
      { name: 'Fire Station', slug: 'fire-station', complexity: 'standard', min: 1, max: 2 },
      { name: 'Community Centre', slug: 'community-centre', complexity: 'standard', min: 1, max: 2 },
      { name: 'Civic Centre', slug: 'civic-centre', complexity: 'high', min: 1, max: 3 },
      { name: 'Embassy / Consular Building', slug: 'embassy', complexity: 'very_high', min: 2, max: 5 },
      { name: 'Museum', slug: 'museum', complexity: 'high', min: 1, max: 3 },
      { name: 'Public Service Centre', slug: 'public-service-centre', complexity: 'standard', min: 1, max: 3 },
    ],
  },
  {
    name: 'Industrial', slug: 'industrial', icon: 'factory', sortOrder: 7,
    description: 'Factories, warehouses, workshops, and industrial facilities',
    baseRate: 2400,
    elemental: { substructurePct: 0.14, framePct: 0.22, upperFloorsPct: 0.08, roofPct: 0.12, externalWallsPct: 0.10, windowsDoorsPct: 0.05, internalFinishesPct: 0.08, externalFinishesPct: 0.03, fittingsPct: 0.02, mechanicalPct: 0.08, electricalPct: 0.06, fireProtectionPct: 0.02 },
    subtypes: [
      { name: 'Factory / Manufacturing Plant', slug: 'factory', complexity: 'high', min: 1, max: 4 },
      { name: 'Assembly Plant', slug: 'assembly-plant', complexity: 'high', min: 1, max: 3 },
      { name: 'Processing Plant', slug: 'processing-plant', complexity: 'very_high', min: 1, max: 4 },
      { name: 'Food Processing Facility', slug: 'food-processing', complexity: 'high', min: 1, max: 3 },
      { name: 'Pharmaceutical Facility', slug: 'pharmaceutical-facility', complexity: 'very_high', min: 1, max: 4 },
      { name: 'Workshop / Engineering Workshop', slug: 'workshop', complexity: 'standard', min: 1, max: 2 },
      { name: 'Industrial Warehouse', slug: 'industrial-warehouse', complexity: 'standard', min: 1, max: 3 },
      { name: 'Logistics Warehouse', slug: 'logistics-warehouse', complexity: 'standard', min: 1, max: 3 },
      { name: 'Distribution Centre', slug: 'distribution-centre', complexity: 'high', min: 1, max: 3 },
      { name: 'Cold Storage Facility', slug: 'cold-storage', complexity: 'high', min: 1, max: 2 },
      { name: 'Light Industrial Building', slug: 'light-industrial', complexity: 'standard', min: 1, max: 3 },
      { name: 'Heavy Industrial Building', slug: 'heavy-industrial', complexity: 'very_high', min: 1, max: 5 },
    ],
  },
  {
    name: 'Agricultural / Agro-Industrial', slug: 'agricultural', icon: 'sprout', sortOrder: 8,
    description: 'Farm buildings, greenhouses, and agro-processing facilities',
    baseRate: 1600,
    elemental: { substructurePct: 0.15, framePct: 0.22, upperFloorsPct: 0.06, roofPct: 0.14, externalWallsPct: 0.10, windowsDoorsPct: 0.05, internalFinishesPct: 0.08, externalFinishesPct: 0.03, fittingsPct: 0.02, mechanicalPct: 0.07, electricalPct: 0.05, fireProtectionPct: 0.01 },
    subtypes: [
      { name: 'Farm Building', slug: 'farm-building', complexity: 'low', min: 1, max: 2 },
      { name: 'Poultry House', slug: 'poultry-house', complexity: 'low', min: 1, max: 2 },
      { name: 'Livestock Facility', slug: 'livestock-facility', complexity: 'standard', min: 1, max: 2 },
      { name: 'Greenhouse', slug: 'greenhouse', complexity: 'standard', min: 1, max: 2 },
      { name: 'Storage Barn', slug: 'storage-barn', complexity: 'low', min: 1, max: 2 },
      { name: 'Grain Storage Facility', slug: 'grain-storage', complexity: 'standard', min: 1, max: 3 },
      { name: 'Agro-Processing Facility', slug: 'agro-processing', complexity: 'high', min: 1, max: 3 },
      { name: 'Fish Processing Facility', slug: 'fish-processing', complexity: 'high', min: 1, max: 2 },
      { name: 'Aquaculture Facility', slug: 'aquaculture-facility', complexity: 'standard', min: 1, max: 2 },
    ],
  },
  {
    name: 'Religious', slug: 'religious', icon: 'church', sortOrder: 9,
    description: 'Churches, mosques, temples, and worship complexes',
    baseRate: 2600,
    elemental: { substructurePct: 0.12, framePct: 0.20, upperFloorsPct: 0.08, roofPct: 0.12, externalWallsPct: 0.08, windowsDoorsPct: 0.06, internalFinishesPct: 0.15, externalFinishesPct: 0.04, fittingsPct: 0.03, mechanicalPct: 0.05, electricalPct: 0.05, fireProtectionPct: 0.02 },
    subtypes: [
      { name: 'Church', slug: 'church', complexity: 'standard', min: 1, max: 3 },
      { name: 'Mosque', slug: 'mosque', complexity: 'standard', min: 1, max: 3 },
      { name: 'Temple / Chapel', slug: 'temple-chapel', complexity: 'standard', min: 1, max: 2 },
      { name: 'Worship Complex', slug: 'worship-complex', complexity: 'high', min: 1, max: 4 },
      { name: 'Religious School / Seminary', slug: 'religious-school', complexity: 'standard', min: 1, max: 3 },
      { name: 'Religious Conference Centre', slug: 'religious-conference', complexity: 'high', min: 1, max: 3 },
    ],
  },
  {
    name: 'Sports & Recreation', slug: 'sports-recreation', icon: 'trophy', sortOrder: 10,
    description: 'Gyms, sports halls, stadiums, and entertainment venues',
    baseRate: 3000,
    elemental: { substructurePct: 0.12, framePct: 0.22, upperFloorsPct: 0.08, roofPct: 0.12, externalWallsPct: 0.08, windowsDoorsPct: 0.05, internalFinishesPct: 0.10, externalFinishesPct: 0.04, fittingsPct: 0.03, mechanicalPct: 0.07, electricalPct: 0.06, fireProtectionPct: 0.03 },
    subtypes: [
      { name: 'Gym / Fitness Centre', slug: 'gym-fitness', complexity: 'standard', min: 1, max: 3 },
      { name: 'Sports Hall', slug: 'sports-hall', complexity: 'high', min: 1, max: 2 },
      { name: 'Indoor Arena', slug: 'indoor-arena', complexity: 'very_high', min: 1, max: 3 },
      { name: 'Football Facility / Stadium', slug: 'football-stadium', complexity: 'very_high', min: 1, max: 3 },
      { name: 'Swimming Facility', slug: 'swimming-facility', complexity: 'high', min: 1, max: 2 },
      { name: 'Recreation Centre', slug: 'recreation-centre', complexity: 'standard', min: 1, max: 3 },
      { name: 'Youth Centre', slug: 'youth-centre', complexity: 'standard', min: 1, max: 2 },
      { name: 'Entertainment Complex', slug: 'entertainment-complex', complexity: 'high', min: 1, max: 4 },
    ],
  },
  {
    name: 'Transport & Infrastructure', slug: 'transport', icon: 'train-front', sortOrder: 11,
    description: 'Bus terminals, parking structures, and transport facilities',
    baseRate: 3400,
    elemental: { substructurePct: 0.12, framePct: 0.22, upperFloorsPct: 0.10, roofPct: 0.10, externalWallsPct: 0.08, windowsDoorsPct: 0.05, internalFinishesPct: 0.10, externalFinishesPct: 0.04, fittingsPct: 0.03, mechanicalPct: 0.07, electricalPct: 0.06, fireProtectionPct: 0.03 },
    subtypes: [
      { name: 'Bus Terminal / Transport Interchange', slug: 'bus-terminal', complexity: 'high', min: 1, max: 3 },
      { name: 'Railway Station Building', slug: 'railway-station', complexity: 'very_high', min: 1, max: 3 },
      { name: 'Airport-Related Building', slug: 'airport-building', complexity: 'very_high', min: 2, max: 5 },
      { name: 'Parking Structure', slug: 'parking-structure', complexity: 'standard', min: 2, max: 6 },
      { name: 'Transportation Depot', slug: 'transport-depot', complexity: 'standard', min: 1, max: 2 },
      { name: 'Logistics Terminal', slug: 'logistics-terminal', complexity: 'high', min: 1, max: 3 },
    ],
  },
  {
    name: 'Energy & Utilities', slug: 'energy-utilities', icon: 'zap', sortOrder: 12,
    description: 'Power facilities, water treatment, and utility buildings',
    baseRate: 3600,
    elemental: { substructurePct: 0.12, framePct: 0.20, upperFloorsPct: 0.08, roofPct: 0.10, externalWallsPct: 0.08, windowsDoorsPct: 0.05, internalFinishesPct: 0.10, externalFinishesPct: 0.04, fittingsPct: 0.03, mechanicalPct: 0.08, electricalPct: 0.08, fireProtectionPct: 0.04 },
    subtypes: [
      { name: 'Substation Building', slug: 'substation', complexity: 'high', min: 1, max: 2 },
      { name: 'Control Building', slug: 'control-building', complexity: 'high', min: 1, max: 2 },
      { name: 'Water Treatment Facility', slug: 'water-treatment', complexity: 'very_high', min: 1, max: 3 },
      { name: 'Water Pumping Facility', slug: 'water-pumping', complexity: 'high', min: 1, max: 2 },
      { name: 'Wastewater Treatment Facility', slug: 'wastewater-treatment', complexity: 'very_high', min: 1, max: 3 },
      { name: 'Waste Management Facility', slug: 'waste-management', complexity: 'high', min: 1, max: 2 },
      { name: 'Renewable Energy Support Building', slug: 'renewable-energy-building', complexity: 'standard', min: 1, max: 2 },
    ],
  },
  {
    name: 'Special Purpose', slug: 'special-purpose', icon: 'boxes', sortOrder: 13,
    description: 'Data centres, markets, fuel stations, and other special buildings',
    baseRate: 4000,
    elemental: { substructurePct: 0.10, framePct: 0.20, upperFloorsPct: 0.10, roofPct: 0.08, externalWallsPct: 0.07, windowsDoorsPct: 0.05, internalFinishesPct: 0.12, externalFinishesPct: 0.03, fittingsPct: 0.03, mechanicalPct: 0.10, electricalPct: 0.08, fireProtectionPct: 0.04 },
    subtypes: [
      { name: 'Data Centre', slug: 'data-centre', complexity: 'very_high', min: 1, max: 5 },
      { name: 'Exhibition / Convention Centre', slug: 'exhibition-centre', complexity: 'very_high', min: 1, max: 3 },
      { name: 'Market / Large-Scale Market', slug: 'market', complexity: 'standard', min: 1, max: 3 },
      { name: 'Fuel Station', slug: 'fuel-station', complexity: 'standard', min: 1, max: 2 },
      { name: 'Cold-Chain Facility', slug: 'cold-chain', complexity: 'high', min: 1, max: 3 },
      { name: 'Innovation Hub / Technology Park', slug: 'innovation-hub', complexity: 'high', min: 2, max: 5 },
    ],
  },
]

function rangeFactor(complexity: string): number {
  if (complexity === 'low') return 0.8
  if (complexity === 'very_high') return 1.2
  return 1.0
}

function defaultProfFees(cat: CategoryDef) {
  const overrides = cat.profFees ?? {}
  return {
    architectFeePct: overrides.architectFeePct ?? 0.08,
    qsFeePct: overrides.qsFeePct ?? 0.04,
    structuralEngFeePct: overrides.structuralEngFeePct ?? 0.04,
    civilEngFeePct: overrides.civilEngFeePct ?? 0.02,
    mechanicalEngFeePct: overrides.mechanicalEngFeePct ?? 0.02,
    electricalEngFeePct: overrides.electricalEngFeePct ?? 0.02,
    geotechFeePct: overrides.geotechFeePct ?? 0.01,
    pmFeePct: overrides.pmFeePct ?? 0.03,
  }
}

export default async function main() {
  console.log('Seeding building types and cost profiles...')

  await prisma.costProfile.deleteMany()
  await prisma.buildingSubtype.deleteMany()
  await prisma.buildingCategory.deleteMany()

  let catCount = 0
  let subCount = 0
  let profCount = 0

  for (const cat of CATEGORIES) {
    const category = await prisma.buildingCategory.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    })
    catCount++

    for (const sub of cat.subtypes) {
      await prisma.buildingSubtype.create({
        data: {
          categoryId: category.id,
          name: sub.name,
          slug: sub.slug,
          complexity: sub.complexity,
          typicalMinFloors: sub.min,
          typicalMaxFloors: sub.max,
          sortOrder: cat.subtypes.indexOf(sub),
        },
      })
      subCount++
    }

    const fees = defaultProfFees(cat)
    const rf = rangeFactor('standard')

    for (const [level, mult] of Object.entries(QUALITY_MULT) as [QualityLevel, number][]) {
      await prisma.costProfile.create({
        data: {
          categoryId: category.id,
          subtypeId: null,
          qualityLevel: level,
          baseCostPerSqm: Math.round(cat.baseRate * mult),
          ...cat.elemental,
          externalWorksPct: 0.10,
          siteDevelopmentPct: 0.05,
          ...fees,
          contingencyPct: 0.10,
          escalationPct: 0.05,
          rangeFactor: rf,
          confidenceLevel: 'medium',
          source: 'BuildCostGH Indicative Dataset v2026.08',
          lastReviewed: new Date('2026-08-01'),
        },
      })
      profCount++
    }
  }

  console.log(`Done: ${catCount} categories, ${subCount} subtypes, ${profCount} cost profiles`)
  await prisma.$disconnect()
}
