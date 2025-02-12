
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [],
  callbacks: {
    async jwt({ token }) {
      return {
        ...token,
        id: 'default-user-id',
      };
    },
    async session({ session }) {
      return {
        ...session,
        user: {
          id: 'default-user-id',
          name: 'Default User',
          email: 'default@example.com',
        },
      };
    },
  },
});
