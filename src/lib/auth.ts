import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { checkRateLimit, recordAttempt } from "./rate-limit"
import { ADMIN_EMAIL } from "./api-auth"
import { secureEqual } from "./secure-compare"
import { verifyPassword } from "./password"
import { prisma } from "./prisma"

function getIp(request?: Request): string | null {
  if (!request) return null
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || null
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = (credentials?.email as string)?.toLowerCase().trim()
        const password = credentials?.password as string
        const ip = getIp(request)

        const rateCheck = await checkRateLimit(ip)
        if (!rateCheck.allowed) return null

        if (!email || !password) {
          await recordAttempt(ip, email || "", false)
          return null
        }

        if (email === ADMIN_EMAIL) {
          const passwordValid = secureEqual(password, process.env.ADMIN_PASSWORD)
          const valid = passwordValid
          await recordAttempt(ip, email, valid)
          if (!valid) return null
          return { id: "1", name: "Admin", email: ADMIN_EMAIL, role: "super_admin" }
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) {
          await recordAttempt(ip, email, false)
          return null
        }

        const valid = await verifyPassword(password, user.passwordHash)
        await recordAttempt(ip, email, valid)
        if (!valid) return null

        return { id: user.id, name: user.name || user.email || "", email: user.email || "", role: user.role || "customer" }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || "customer"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || "customer"
      }
      return session
    },
  },
})
