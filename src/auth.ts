import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// @auth/prisma-adapter types its argument against the standard @prisma/client
// package. This project uses Prisma 7's custom client output
// (generated/prisma) instead, so @prisma/client has no real PrismaClient
// export to import here (it's runtime-compatible, just structurally
// different) - cast through the adapter's own parameter type rather than
// depending on @prisma/client's type export at all.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]),
  providers: [Google],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const allowed = await prisma.allowedEmail.findUnique({
        where: { email: user.email },
      });
      return Boolean(allowed);
    },
  },
});
