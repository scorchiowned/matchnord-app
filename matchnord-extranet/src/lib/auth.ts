import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import { env } from './env';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  providers: [
    // Email/password credentials provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Look up user by email
        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
            emailVerified: true,
            isActive: true,
          },
        });

        if (!user) {
          return null;
        }

        // Check if user has a password (required for email/password auth)
        if (!user.password) {
          return null;
        }

        // Check if user is active
        if (!user.isActive) {
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          return null;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      console.log('Session callback - token:', token);
      console.log('Session callback - session:', session);
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
        },
      };
    },
    jwt: ({ token, user }) => {
      console.log('JWT callback - user:', user);
      console.log('JWT callback - token:', token);
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
};
