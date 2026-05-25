import "next-auth";
import "next-auth/jwt";

interface CustomerUser {
  id: number;
  email: string;
  phone: string;
  firstname: string;
  lastname: string;
  balance: number;
  currency: string;
  type: number;
  status: number;
}

declare module "next-auth" {
  interface Session {
    user: CustomerUser;
    accessToken?: string;
  }
  interface User {
    accessToken: string;
    user: CustomerUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    user?: CustomerUser;
  }
}
