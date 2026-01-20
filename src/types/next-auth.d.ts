import NextAuth from "next-auth";
import { DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: User;
  }
  interface User extends DefaultUser {
    userId?: string;
    accessToken?: string;
    token?: string;
    company?: { name: string };
    emailVerified?: Date | undefined;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: any;
  }
}
