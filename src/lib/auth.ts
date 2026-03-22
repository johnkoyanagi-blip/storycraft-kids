import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const account = await prisma.account.findUnique({
          where: { email: credentials.email },
        });
        if (!account) return null;
        const valid = await bcrypt.compare(credentials.password, account.passwordHash);
        if (!valid) return null;
        return { id: account.id, email: account.email };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.accountId = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).accountId = token.accountId; }
      return session;
    },
  },
  pages: { signIn: '/login' },
};
