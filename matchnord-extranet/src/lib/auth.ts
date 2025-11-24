import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import { env } from './env';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
  },
  providers: [
    // Development credentials provider for testing
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Credentials received:', credentials);

        if (!credentials?.email) {
          console.log('No email provided');
          return null;
        }

        // For development, allow login with test emails
        // Note: Roles are now USER by default (except admin), permissions assigned per tournament
        const testUsers = [
          { email: 'admin@test.com', role: 'ADMIN' },
          { email: 'manager@test.com', role: 'USER' },
          { email: 'tournament@test.com', role: 'USER' },
          { email: 'referee@test.com', role: 'USER' },
        ];

        const testUser = testUsers.find(
          (user) => user.email === credentials.email
        );

        console.log('Test user found:', testUser);

        if (testUser) {
          // Look up the actual user from the database to get the correct ID
          const dbUser = await db.user.findUnique({
            where: { email: testUser.email },
            select: { id: true, email: true, name: true, role: true },
          });

          if (dbUser) {
            const user = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name || testUser.email.split('@')[0],
              role: dbUser.role,
            };
            console.log('Returning user:', user);
            return user;
          }
        }

        console.log('No matching test user found');
        return null;
      },
    }),
    // Only enable email provider if email configuration is available
    ...(env.EMAIL_SERVER_HOST &&
    env.EMAIL_SERVER_PORT &&
    env.EMAIL_SERVER_USER &&
    env.EMAIL_SERVER_PASSWORD
      ? [
          EmailProvider({
            server: {
              host: env.EMAIL_SERVER_HOST,
              port: env.EMAIL_SERVER_PORT,
              auth: {
                user: env.EMAIL_SERVER_USER,
                pass: env.EMAIL_SERVER_PASSWORD,
              },
            },
            from: env.EMAIL_FROM || 'noreply@localhost',
          }),
        ]
      : []),
    // Only enable Google provider if credentials are available
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
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
