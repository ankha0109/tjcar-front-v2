import Echo from "laravel-echo";
import Pusher from "pusher-js";

type ReverbEcho = Echo<"reverb">;

let echoInstance: ReverbEcho | null = null;
let cachedToken: string | null = null;

function getApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "";
  // NEXT_PUBLIC_API_URL может оканчиваться /api — broadcasting/auth живёт под /broadcasting/auth
  // прямо на корне Laravel-приложения. Strip a trailing /api segment if present.
  return raw.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

export function getEcho(token?: string | null): ReverbEcho {
  if (typeof window === "undefined") {
    throw new Error("Echo client can only be created in the browser");
  }

  const nextToken = token ?? null;
  if (echoInstance && cachedToken === nextToken) {
    return echoInstance;
  }

  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // ignore
    }
    echoInstance = null;
  }

  (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

  // Verbose Pusher logging in dev — surfaces every WS frame in the browser console.
  if (process.env.NODE_ENV !== "production") {
    Pusher.logToConsole = true;
  }

  const apiOrigin = getApiOrigin();

  echoInstance = new Echo<"reverb">({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_KEY ?? "",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiOrigin}/broadcasting/auth`,
    auth: {
      headers: nextToken
        ? {
            Authorization: `Bearer ${nextToken}`,
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
          },
    },
  });

  cachedToken = nextToken;
  return echoInstance;
}

export function disconnectEcho(): void {
  if (!echoInstance) return;
  try {
    echoInstance.disconnect();
  } catch {
    // ignore
  }
  echoInstance = null;
  cachedToken = null;
}
