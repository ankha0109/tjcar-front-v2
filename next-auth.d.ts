import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    token: string;
    company: {
      name: string;
    };
    user: User;
  }

  interface User {
    id: string;
    emailVerified?: Date;
    token?: string;
    company?: {
      name: string;
    };
    user?: {
      id: string;
      name?: string;
      email: string;
      emailVerified?: Date;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    token?: string;
    company?: {
      name: string;
    };
    user?: User;
  }
}
