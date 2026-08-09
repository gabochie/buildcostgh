import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { checkRateLimit, recordAttempt } from "./rate-limit"
import { ADMIN_EMAIL } from "./api-auth"
import { secureEqual } from "./secure-compare"

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
        const email = credentials?.email as string
        const password = credentials?.password as string
        const ip = getIp(request)

        const rateCheck = await checkRateLimit(ip)
        if (!rateCheck.allowed) return null

        const passwordValid = secureEqual(password, process.env.ADMIN_PASSWORD)
        const valid = email === ADMIN_EMAIL && passwordValid
        await recordAttempt(ip, email, valid)

        if (!valid) return null
        return { id: "1", name: "Admin", email: ADMIN_EMAIL }
      },
    }),
  ],
  pages: {
    signIn: "/admin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
})
