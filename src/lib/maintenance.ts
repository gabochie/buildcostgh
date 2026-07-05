import { prisma } from "./prisma"

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "maintenanceMode" } })
    return setting?.value === "true"
  } catch {
    return false
  }
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: "maintenanceMode" },
    update: { value: enabled ? "true" : "false" },
    create: { key: "maintenanceMode", value: enabled ? "true" : "false" },
  })
}
