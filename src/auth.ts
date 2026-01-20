import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

interface LoginResponse {
  company: {
    name: string;
  };
  user: {
    id: string;
    name?: string;
    email: string;
    emailVerified?: Date;
  };
  token: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${process.env.API_URL}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data: LoginResponse = await response.json();

          if (!data.token || !data.user?.id) {
            return null;
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            emailVerified: data.user.emailVerified,
            token: data.token,
            company: data.company,
            user: data.user,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.token = user.token;
        token.company = user.company;
        token.user = user.user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.token && token?.company && token?.user) {
        session.token = token.token;
        session.company = token.company;
        session.user = token.user;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 10 * 60 * 60, // 10 hours
  },
});
