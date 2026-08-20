import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Ghana 16 Regions ──
const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Western North', 'Oti', 'North East', 'Savannah',
]

// ── Major MMDAs per region ──
const MMDAS: Record<string, string[]> = {
  'Greater Accra': ['Accra Metropolitan Assembly', 'Tema Metropolitan Assembly', 'Ashaiman Municipal Assembly', 'La Nkwantanang-Madina Municipal Assembly', 'Ledzokuku Municipal Assembly'],
  'Ashanti': ['Kumasi Metropolitan Assembly', 'Ejisu Municipal Assembly', 'Ejura Sekyedumase Municipal Assembly', 'Kwadaso Municipal Assembly', 'Oforikrom Municipal Assembly'],
  'Western': ['Takoradi Metropolitan Assembly', 'Sekondi-Takoradi Metropolitan Assembly', 'Tarkwa-Nsuaem Municipal Assembly', 'Prestea-Huni Valley Municipal Assembly'],
  'Central': ['Cape Coast Metropolitan Assembly', 'Mfantsiman Municipal Assembly', 'Effutu Municipal Assembly', 'Agona West Municipal Assembly'],
  'Eastern': ['New Juaben South Municipal Assembly', 'Nsawam-Adoagyiri Municipal Assembly', 'Akropong Municipal Assembly'],
  'Volta': ['Ho Municipal Assembly', 'Hohoe Municipal Assembly', 'Keta Municipal Assembly'],
  'Northern': ['Tamale Metropolitan Assembly', 'Sagnarigu Municipal Assembly', 'Tolon Municipal Assembly'],
  'Upper East': ['Bolgatanga Municipal Assembly', 'Bawku Municipal Assembly', 'Navrongo Municipal Assembly'],
  'Upper West': ['Wa Municipal Assembly', 'Lawra Municipal Assembly', 'Jirapa Municipal Assembly'],
  'Bono': ['Sunyani Municipal Assembly', 'Dormaa Central Municipal Assembly', 'Berekum Municipal Assembly'],
  'Bono East': ['Techiman Municipal Assembly', 'Nkoranza Municipal Assembly', 'Atebubu-Amantin Municipal Assembly'],
  'Ahafo': ['Goaso Municipal Assembly', 'Duayaw Nkwanta Municipal Assembly', 'Bechem Municipal Assembly'],
  'Western North': ['Sefwi Wiawso Municipal Assembly', 'Bibiani-Anhwiaso-Bekwai Municipal Assembly'],
  'Oti': ['Dambai Municipal Assembly', 'Jasikan Municipal Assembly', 'Kpando Municipal Assembly'],
  'North East': ['Nalerigu Municipal Assembly', 'Yendi Municipal Assembly'],
  'Savannah': ['Damongo Municipal Assembly', 'Salaga Municipal Assembly'],
}

// ── Sector authorities ──
const SECTOR_AUTHORITIES = [
  { name: 'Environmental Protection Agency (EPA)', type: 'Sector', region: 'National' },
  { name: 'Ghana Fire Service', type: 'Sector', region: 'National' },
  { name: 'Ghana Investment Promotion Centre (GIPC)', type: 'Sector', region: 'National' },
  { name: 'Ghana Standards Authority (GSA)', type: 'Sector', region: 'National' },
  { name: 'Land Use and Spatial Planning Authority (LUSPA)', type: 'Sector', region: 'National' },
  { name: 'Works and Housing Ministry', type: 'National', region: 'National' },
  { name: 'Ghana Institute of Architects', type: 'Professional', region: 'National' },
  { name: 'Ghana Institution of Surveyors', type: 'Professional', region: 'National' },
]

// ── Permit requirements ──
const PERMIT_REQUIREMENTS = [
  // Universal requirements
  {
    name: 'Land ownership / interest documentation',
    description: 'Title deed, lease agreement, or letter of allocation proving right to build on the site',
    category: 'documentation',
    required: 'required',
    appliesTo: { allBuildingTypes: true },
    authority: 'Land Commission / Lands Commission',
    source: 'Land Use Act, 1962 (Act 125)',
    sortOrder: 1,
  },
  {
    name: 'Site plan / location plan',
    description: 'Scaled site plan showing the proposed building location, boundaries, setbacks, and access',
    category: 'documentation',
    required: 'required',
    appliesTo: { allBuildingTypes: true },
    authority: 'MMDA',
    sortOrder: 2,
  },
  {
    name: 'Architectural drawings',
    description: 'Floor plans, elevations, sections, and details prepared by a registered architect',
    category: 'documentation',
    required: 'required',
    appliesTo: { allBuildingTypes: true },
    authority: 'MMDA',
    source: 'Building Regulations',
    sortOrder: 3,
  },
  {
    name: 'Structural drawings and calculations',
    description: 'Foundation, frame, and structural details with engineering calculations',
    category: 'documentation',
    required: 'required',
    appliesTo: { allBuildingTypes: true },
    authority: 'MMDA',
    sortOrder: 4,
  },
  {
    name: 'Building permit application form',
    description: 'Completed MMDA building permit application with required fees',
    category: 'approval',
    required: 'required',
    appliesTo: { allBuildingTypes: true },
    authority: 'MMDA',
    sortOrder: 5,
  },
  {
    name: 'Professional certifications',
    description: 'Sign-off from registered architect and structural engineer',
    category: 'certification',
    required: 'required',
    appliesTo: { allBuildingTypes: true },
    authority: 'MMDA',
    sortOrder: 6,
  },

  // Conditional — based on building characteristics
  {
    name: 'Environmental Impact Assessment (EIA)',
    description: 'Required for projects likely to have significant environmental impact',
    category: 'approval',
    required: 'conditional',
    appliesTo: { buildingCategories: ['industrial', 'energy-utilities', 'agricultural'], minArea: 1000, specialUses: ['manufacturing', 'processing', 'waste'] },
    authority: 'Environmental Protection Agency (EPA)',
    source: 'Environmental Assessment Regulations, 1999 (LI 1652)',
    sortOrder: 10,
  },
  {
    name: 'Fire safety documentation',
    description: 'Fire escape plans, fire extinguisher layout, fire-resistant construction details',
    category: 'documentation',
    required: 'conditional',
    appliesTo: { buildingCategories: ['commercial', 'hospitality', 'healthcare', 'institutional', 'special-purpose'], minFloors: 3, minArea: 500 },
    authority: 'Ghana Fire Service',
    sortOrder: 11,
  },
  {
    name: 'Mechanical drawings (HVAC, plumbing)',
    description: 'Mechanical services drawings including ventilation, air conditioning, and plumbing systems',
    category: 'documentation',
    required: 'conditional',
    appliesTo: { buildingCategories: ['commercial', 'hospitality', 'healthcare', 'industrial', 'special-purpose'], minArea: 500 },
    authority: 'MMDA',
    sortOrder: 12,
  },
  {
    name: 'Electrical drawings',
    description: 'Electrical layout, load calculations, and distribution board details',
    category: 'documentation',
    required: 'conditional',
    appliesTo: { buildingCategories: ['commercial', 'hospitality', 'healthcare', 'industrial', 'institutional', 'special-purpose'], minArea: 300 },
    authority: 'MMDA',
    sortOrder: 13,
  },
  {
    name: 'Geotechnical / soil investigation report',
    description: 'Soil bearing capacity and groundwater level investigation for foundation design',
    category: 'documentation',
    required: 'conditional',
    appliesTo: { minFloors: 4, minArea: 1000, buildingCategories: ['commercial', 'hospitality', 'healthcare', 'institutional', 'industrial', 'special-purpose'] },
    authority: 'MMDA',
    sortOrder: 14,
  },
  {
    name: 'Topographical survey',
    description: 'Detailed site survey showing contours, existing structures, and services',
    category: 'documentation',
    required: 'conditional',
    appliesTo: { minArea: 2000, buildingCategories: ['industrial', 'transport', 'energy-utilities', 'institutional'] },
    authority: 'Survey Division / MMDA',
    sortOrder: 15,
  },
  {
    name: 'Drainage / sewage connection approval',
    description: 'Approval for connection to municipal drainage or sewage system',
    category: 'approval',
    required: 'conditional',
    appliesTo: { buildingCategories: ['residential', 'commercial', 'hospitality', 'healthcare', 'institutional'], minArea: 500 },
    authority: 'MMDA / Ghana Water Company',
    sortOrder: 16,
  },
  {
    name: 'Utility connection permits (electricity, water)',
    description: 'Approvals from ECG, NEDCo, or Ghana Water for utility connections',
    category: 'approval',
    required: 'conditional',
    appliesTo: { allBuildingTypes: true, minArea: 200 },
    authority: 'ECG / NEDCo / Ghana Water Company',
    sortOrder: 17,
  },
  {
    name: 'Food and Drug Authority (FDA) clearance',
    description: 'Required for food processing, pharmaceutical, and food service facilities',
    category: 'approval',
    required: 'conditional',
    appliesTo: { buildingCategories: ['healthcare', 'industrial', 'agricultural'], specialUses: ['food', 'pharmaceutical', 'laboratory'] },
    authority: 'Food and Drugs Authority',
    sortOrder: 18,
  },
  {
    name: 'Ghana Investment Promotion Centre registration',
    description: 'Required for foreign-owned developments above a threshold',
    category: 'approval',
    required: 'conditional',
    appliesTo: { specialUses: ['foreign-owned', 'export-processing'] },
    authority: 'Ghana Investment Promotion Centre (GIPC)',
    sortOrder: 19,
  },
  {
    name: 'Hotel / hospitality license',
    description: 'Tourism and hospitality operating license from Ghana Tourism Authority',
    category: 'approval',
    required: 'conditional',
    appliesTo: { buildingCategories: ['hospitality'] },
    authority: 'Ghana Tourism Authority',
    sortOrder: 20,
  },
  {
    name: 'Educational facility accreditation',
    description: 'Approval from Ghana Education Service or National Council for Tertiary Education',
    category: 'approval',
    required: 'conditional',
    appliesTo: { buildingCategories: ['education'] },
    authority: 'Ghana Education Service',
    sortOrder: 21,
  },
  {
    name: 'Health facility license',
    description: 'Ghana Health Service facility registration and licensing',
    category: 'approval',
    required: 'conditional',
    appliesTo: { buildingCategories: ['healthcare'] },
    authority: 'Ghana Health Service',
    sortOrder: 22,
  },
  {
    name: 'Noise / pollution control assessment',
    description: 'Required for industrial operations near residential areas',
    category: 'documentation',
    required: 'conditional',
    appliesTo: { buildingCategories: ['industrial', 'sports-recreation'] },
    authority: 'Environmental Protection Agency (EPA)',
    sortOrder: 23,
  },

  // Large-scale requirements
  {
    name: 'Traffic impact assessment',
    description: 'Required for developments generating significant traffic',
    category: 'documentation',
    required: 'conditional',
    appliesTo: { minArea: 5000, buildingCategories: ['commercial', 'institutional', 'transport'] },
    authority: 'MMDA / Department of Urban Roads',
    sortOrder: 25,
  },
  {
    name: 'Structural integrity report (existing building)',
    description: 'Required when extending or modifying existing structures',
    category: 'documentation',
    required: 'conditional',
    appliesTo: { developmentType: 'renovation' },
    authority: 'MMDA',
    sortOrder: 26,
  },
]

async function main() {
  console.log('Seeding permit requirements and authorities...')

  // Clean
  await prisma.authority.deleteMany()
  await prisma.permitRequirement.deleteMany()

  // Seed MMDAs
  let authCount = 0
  for (const [region, mmdas] of Object.entries(MMDAS)) {
    for (const name of mmdas) {
      await prisma.authority.create({
        data: { name, type: 'MMDA', region, isActive: true },
      })
      authCount++
    }
  }

  // Seed sector authorities
  for (const auth of SECTOR_AUTHORITIES) {
    await prisma.authority.create({ data: { ...auth, isActive: true } })
    authCount++
  }

  // Seed permit requirements
  let reqCount = 0
  for (const req of PERMIT_REQUIREMENTS) {
    await prisma.permitRequirement.create({ data: { ...req, isActive: true } })
    reqCount++
  }

  console.log(`Done: ${authCount} authorities, ${reqCount} permit requirements`)
  await prisma.$disconnect()
}

main()
