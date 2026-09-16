"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/auth-provider";

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (ready && user) router.replace("/dashboard"); }, [ready, user, router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try { await login(identifier, password); router.replace("/dashboard"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in"); } finally { setLoading(false); }
  }
  return <main className="grid min-h-screen items-center bg-[#edf5f0] p-4 sm:p-8"><section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#d6e4dc] bg-white md:grid-cols-[.9fr_1.1fr]">
    <div className="bg-school-700 p-7 text-white sm:p-10"><div className="grid h-11 w-11 place-items-center rounded-lg border border-white/30 text-lg font-bold" aria-hidden="true">DK</div><p className="mt-12 text-sm font-semibold uppercase tracking-[.16em] text-school-100">School management</p><h1 className="mt-3 text-3xl font-bold leading-tight">Darul-Karim<br />School System</h1><p className="mt-5 max-w-sm text-sm leading-6 text-school-100">A secure shared register for school administrators, teachers, students, and parents.</p><p className="mt-12 text-xs leading-5 text-school-100">Development access uses the credentials documented in the project README.</p></div>
    <div className="p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-school-700">Secure sign in</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Welcome back</h2><p className="mt-2 text-sm text-[#52665a]">Students use their roll number. Other users use their email address.</p>
      <form className="mt-7 space-y-5" onSubmit={submit} noValidate><div><label className="field-label" htmlFor="identifier">Email or roll number</label><input className="field" id="identifier" autoComplete="username" required minLength={3} value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="e.g. DK-1001" /></div><div><label className="field-label" htmlFor="password">Password</label><input className="field" id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></div>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}<button className="btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form>
    </div>
  </section></main>;
}
