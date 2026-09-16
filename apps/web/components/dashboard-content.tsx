"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useRequireAuth } from "../hooks/use-require-auth";

type Card = { key: string; label: string; value: string | number; format?: "currency" };
type DashboardData = {
  cards: Card[];
  upcomingExams: Array<{ id: string; title: string; startDate: string; class?: { name: string } }>;
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
  assignments?: Array<{ id: string; title: string; dueDate: string; subject?: { name: string } }>;
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function DashboardContent() {
  const { user, ready } = useRequireAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); setError(""); api<DashboardData>("/dashboard").then(setData).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load dashboard")).finally(() => setLoading(false)); };
  useEffect(() => { if (ready && user) load(); }, [ready, user]);
  if (!ready || !user) return null;
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-school-700">{user.role.toLowerCase()} workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1><p className="mt-2 text-sm text-[#52665a]">Your current school activity from the shared register.</p></div>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh data"}</button>
      </header>
      {error ? <section className="panel mt-6 p-6" role="alert"><h2 className="font-bold">Dashboard unavailable</h2><p className="mt-1 text-sm text-[#52665a]">{error}</p><button className="btn-primary mt-4" onClick={load}>Retry</button></section> : loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">{Array.from({ length: 6 }).map((_, index) => <div className="panel h-28 animate-pulse bg-slate-100" key={index} />)}</div> : data ? <>
        <section className="mt-6" aria-label="Live school summary"><p className="mb-3 text-xs font-bold uppercase tracking-[.12em] text-[#52665a]">Live register summary</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.cards.map((card) => <article className="panel p-5" key={card.key}><p className="text-sm font-semibold text-[#52665a]">{card.label}</p><p className="mt-3 text-3xl font-bold tracking-tight">{card.format === "currency" ? money.format(Number(card.value)) : card.value}</p></article>)}</div></section>
        <section className="mt-6 grid gap-6 xl:grid-cols-2"><RegisterList title="Upcoming exams" empty="No upcoming exams are recorded." items={data.upcomingExams.map((exam) => ({ id: exam.id, heading: exam.title, detail: `${exam.class?.name || "School"} · ${date.format(new Date(exam.startDate))}` }))} /><RegisterList title="Announcements" empty="No announcements have been published." items={data.announcements.map((announcement) => ({ id: announcement.id, heading: announcement.title, detail: announcement.body }))} /></section>
        {data.assignments && <section className="mt-6"><RegisterList title="Assignments" empty="No assignments are recorded." items={data.assignments.map((assignment) => ({ id: assignment.id, heading: assignment.title, detail: `${assignment.subject?.name || "Subject"} · due ${date.format(new Date(assignment.dueDate))}` }))} /></section>}
      </> : null}
    </>
  );
}

function RegisterList({ title, items, empty }: { title: string; items: Array<{ id: string; heading: string; detail: string }>; empty: string }) { return <section className="panel p-5"><h2 className="text-lg font-bold">{title}</h2>{items.length ? <ul className="mt-4 divide-y divide-[#d6e4dc]">{items.map((item) => <li className="py-3" key={item.id}><p className="font-semibold">{item.heading}</p><p className="mt-1 text-sm text-[#52665a]">{item.detail}</p></li>)}</ul> : <p className="mt-4 rounded-lg bg-[#f7faf8] p-4 text-sm text-[#52665a]">{empty}</p>}</section>; }
