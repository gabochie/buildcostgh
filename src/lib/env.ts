import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors)
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables")
    }
    return false
  }
  return true
}

export function getEnv() {
  return envSchema.parse(process.env)
}
