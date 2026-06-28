import { cookies } from "next/headers";

export type Device = "mobile" | "desktop";

export const DEVICE_COOKIE = "tjcar-device";

export async function getDevice(): Promise<Device> {
  const c = await cookies();
  return c.get(DEVICE_COOKIE)?.value === "mobile" ? "mobile" : "desktop";
}
