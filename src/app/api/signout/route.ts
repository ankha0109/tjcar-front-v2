import { signOut } from "@/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
  await signOut({ redirectTo: callbackUrl });
}
