"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { setCachedSession } from "@/services/Api";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialSession
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const [session, setSession] = useState<Session | null>(initialSession || null);
  const [loading, setLoading] = useState(!initialSession);

  const refreshSession = async () => {
    try {
      const newSession = await getSession();
      setSession(newSession);
      setCachedSession(newSession); // Update cache when session refreshes
    } catch (error) {
      console.error("Failed to refresh session:", error);
      setSession(null);
      setCachedSession(null); // Clear cache on error
    }
  };

  useEffect(() => {
    // Only fetch session if no initial session was provided
    if (!initialSession) {
      refreshSession().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [initialSession]);

  return (
    <AuthContext.Provider value={{ session, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
