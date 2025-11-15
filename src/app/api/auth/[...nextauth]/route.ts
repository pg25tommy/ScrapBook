import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Check against environment variables
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';

        // FORCE hardcoded hash - .env parsing is broken for bcrypt hashes with $ symbols
        const envHash = process.env.ADMIN_PASSWORD_HASH;
        const adminPasswordHash = (envHash && envHash.length === 60)
          ? envHash
          : '$2b$10$Td5Xv5lH4dTVY3cYYbLWo.ySYoFiR.7KZ.nYcsLQNQ9b2brKsrG6O';

        if (!adminUsername || !adminPasswordHash) {
          return null;
        }

        // Verify username
        if (credentials.username !== adminUsername) {
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, adminPasswordHash);
        if (!isValid) {
          return null;
        }

        // Return user object
        return {
          id: '1',
          name: adminUsername,
          email: `${adminUsername}@admin.local`,
        };
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };