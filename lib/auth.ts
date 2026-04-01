import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Admin via env vars
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const extraAdminEmail = process.env.EXTRA_ADMIN_EMAIL;
        const extraAdminPassword = process.env.EXTRA_ADMIN_PASSWORD;

        if (
          (credentials.email === adminEmail && credentials.password === adminPassword) ||
          (credentials.email === extraAdminEmail && credentials.password === extraAdminPassword)
        ) {
          return {
            id: 'admin',
            email: credentials.email,
            name: 'Admin',
            isAdmin: true,
            isFriend: false,
          };
        }

        // DB auth via Prisma
        try {
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          await prisma.$disconnect();

          if (!user || !user.isActive) return null;

          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name || 'User',
            isAdmin: user.isAdmin,
            isFriend: false,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = (user as any).isAdmin;
        token.isFriend = (user as any).isFriend;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).isFriend = token.isFriend;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
};
