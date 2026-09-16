"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth-provider";

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => { if (auth.ready && !auth.user) router.replace("/login"); }, [auth.ready, auth.user, router]);
  return auth;
}
