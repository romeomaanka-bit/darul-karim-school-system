"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, clearSession, readSession, writeSession } from "../lib/api";
import type { Role, SessionUser } from "../types";

type AuthContextValue = { user: SessionUser | null; ready: boolean; login: (identifier: string, password: string) => Promise<SessionUser>; logout: () => Promise<void>; };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const session = readSession();
    if (!session) { setReady(true); return; }
    api<SessionUser>("/auth/me").then(setUser).catch(clearSession).finally(() => setReady(true));
  }, []);
  const login = useCallback(async (identifier: string, password: string) => {
    const result = await api<{ accessToken: string; user: SessionUser }>("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) });
    writeSession({ accessToken: result.accessToken });
    setUser(result.user);
    return result.user;
  }, []);
  const logout = useCallback(async () => { try { await api("/auth/logout", { method: "POST" }); } finally { clearSession(); setUser(null); } }, []);
  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider"); return context; }
export function displayName(user: SessionUser) { const profile = user.student || user.teacher || user.parent; return profile ? `${profile.firstName} ${profile.lastName}` : user.email || user.role; }
export const roleLabel: Record<Role, string> = { ADMIN: "Administrator", TEACHER: "Teacher", STUDENT: "Student", PARENT: "Parent" };
