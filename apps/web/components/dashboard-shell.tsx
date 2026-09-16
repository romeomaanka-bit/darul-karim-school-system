"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { displayName, roleLabel, useAuth } from "./auth-provider";
import type { Role } from "../types";

type NavItem = { id: string; label: string };
const nav: Record<Role, NavItem[]> = {
  ADMIN: [{ id: "dashboard", label: "Dashboard" }, { id: "students", label: "Students" }, { id: "teachers", label: "Teachers" }, { id: "parents", label: "Parents" }, { id: "classes", label: "Classes" }, { id: "subjects", label: "Subjects" }, { id: "attendance", label: "Attendance" }, { id: "timetable", label: "Timetable" }, { id: "exams", label: "Exams" }, { id: "results", label: "Results" }, { id: "assignments", label: "Assignments" }, { id: "fees", label: "Fees" }, { id: "payments", label: "Payments" }, { id: "announcements", label: "Announcements" }, { id: "notifications", label: "Notifications" }, { id: "complaints", label: "Complaints" }, { id: "reports", label: "Reports" }, { id: "settings", label: "Settings" }],
  TEACHER: [{ id: "dashboard", label: "Dashboard" }, { id: "classes", label: "My classes" }, { id: "students", label: "Students" }, { id: "attendance", label: "Attendance" }, { id: "timetable", label: "Timetable" }, { id: "assignments", label: "Assignments" }, { id: "exams", label: "Exams" }, { id: "results", label: "Results" }, { id: "announcements", label: "Announcements" }, { id: "profile", label: "Profile" }],
  STUDENT: [{ id: "dashboard", label: "Dashboard" }, { id: "profile", label: "My profile" }, { id: "timetable", label: "My timetable" }, { id: "attendance", label: "Attendance" }, { id: "exams", label: "Exams" }, { id: "results", label: "Results" }, { id: "assignments", label: "Assignments" }, { id: "fees", label: "Fees" }, { id: "announcements", label: "Announcements" }, { id: "notifications", label: "Notifications" }, { id: "complaints", label: "Complaints" }],
  PARENT: [{ id: "dashboard", label: "Dashboard" }, { id: "children", label: "My children" }, { id: "attendance", label: "Attendance" }, { id: "results", label: "Results" }, { id: "timetable", label: "Timetable" }, { id: "assignments", label: "Assignments" }, { id: "fees", label: "Fees" }, { id: "announcements", label: "Announcements" }, { id: "notifications", label: "Notifications" }]
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  if (!ready || !user) return <main className="grid min-h-screen place-items-center p-6"><p className="text-sm text-[#52665a]">Checking your secure session…</p></main>;
  const items = nav[user.role];
  return <div className="min-h-screen bg-[#f7faf8] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]"><aside className="border-b border-[#d6e4dc] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r"><div className="flex items-center justify-between p-4 lg:px-5 lg:pt-6"><Link href="/dashboard" className="flex items-center gap-3 text-school-ink"><span className="grid h-10 w-10 place-items-center rounded-lg bg-school-700 font-bold text-white" aria-hidden="true">DK</span><span><span className="block text-sm font-bold">Darul-Karim</span><span className="block text-xs text-[#52665a]">School System</span></span></Link><details className="relative lg:hidden"><summary className="cursor-pointer rounded-lg border border-[#b8cbbe] px-3 py-2 text-sm font-semibold">Menu</summary><nav className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[#d6e4dc] bg-white p-2 shadow-lg" aria-label="Mobile navigation">{items.map((item) => <NavLink item={item} pathname={pathname} key={item.id} />)}</nav></details></div><nav className="hidden flex-1 overflow-y-auto px-3 py-5 lg:block" aria-label="School registers">{items.map((item) => <NavLink item={item} pathname={pathname} key={item.id} />)}</nav><div className="hidden border-t border-[#d6e4dc] p-4 lg:block"><p className="truncate text-sm font-bold">{displayName(user)}</p><p className="mt-0.5 text-xs text-[#52665a]">{roleLabel[user.role]}</p><button className="mt-3 text-sm font-semibold text-school-700 underline underline-offset-4" onClick={() => void logout()}>Sign out</button></div></aside><main className="min-w-0 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1520px]">{children}</div></main></div>;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const href = item.id === "dashboard" ? "/dashboard" : `/${item.id}`;
  const active = pathname === href;
  return <Link href={href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "nav-link-active" : ""}`}>{item.label}</Link>;
}
