import type { ApiEnvelope } from "../types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const sessionKey = "darul-karim-session";

export type StoredSession = { accessToken: string };

export function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.sessionStorage.getItem(sessionKey) || "null") as StoredSession | null; } catch { return null; }
}

export function writeSession(session: StoredSession) { window.sessionStorage.setItem(sessionKey, JSON.stringify(session)); }
export function clearSession() { window.sessionStorage.removeItem(sessionKey); }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readSession()?.accessToken;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || "The request could not be completed");
  return payload.data;
}
