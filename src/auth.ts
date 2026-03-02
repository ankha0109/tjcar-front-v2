import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}

class ServerError extends CredentialsSignin {
  code = "server_error";
}

interface LoginResponse {
  user: {
    id: number;
    email: string;
    phone: string;
    firstname: string;
    lastname: string;
    balance: number;
    currency: string;
    type: number;
    status: number;
  };
  accessToken: string;
  expires: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone: { label: "Утасны дугаар", type: "phone" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.phone || !credentials?.password) {
          throw new InvalidCredentials();
        }

        let response: Response;
        try {
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              phone: credentials.phone,
              password: credentials.password,
            }),
          });
        } catch (error) {
          console.error("Auth network error:", error);
          throw new ServerError();
        }

        if (response.status === 401 || response.status === 422) {
          throw new InvalidCredentials();
        }

        if (!response.ok) {
          throw new ServerError();
        }

        const data: LoginResponse = await response.json();

        if (!data.accessToken || !data.user?.id) {
          throw new ServerError();
        }

        return {
          id: String(data.user.id),
          email: data.user.email,
          name: `${data.user.firstname} ${data.user.lastname}`,
          accessToken: data.accessToken,
          user: {
            ...data.user,
            id: String(data.user.id),
          },
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.user = user.user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user;
      }
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 10 * 60 * 60, // 10 hours
  },
});
