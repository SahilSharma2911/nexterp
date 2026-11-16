"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/session";
import { canWrite, isAdmin, type Area } from "@/lib/permissions";

// Makes the logged-in user available to client components so the UI can hide
// controls the user isn't allowed to use. The server (proxy + route handlers)
// stays the real enforcement boundary — this is purely cosmetic.

const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSession must be used within <SessionProvider>");
  return user;
}

export function useCanWrite(area: Area): boolean {
  return canWrite(useSession().role, area);
}

export function useIsAdmin(): boolean {
  return isAdmin(useSession().role);
}
