import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// @auth/prisma-adapter types its argument against the standard @prisma/client
// package. This project uses Prisma 7's custom client output
// (generated/prisma), which is a structurally different (but runtime-
// compatible) PrismaClient type - the cast below is a type-only workaround.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as unknown as PrismaClient),
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
