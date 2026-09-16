import type { Response } from "express";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedRequest } from "../types.js";
import { ok } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

const startOfToday = () => { const value = new Date(); value.setHours(0, 0, 0, 0); return value; };

export async function dashboard(request: AuthenticatedRequest, response: Response) {
  const user = request.user!;
  const today = startOfToday();
  if (user.role === "ADMIN") {
    const [students, teachers, classes, todayAttendance, pendingFees, upcomingExams, announcements] = await Promise.all([
      prisma.student.count(), prisma.teacher.count(), prisma.class.count(), prisma.attendance.count({ where: { date: today, status: "PRESENT" } }), prisma.fee.aggregate({ where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } }, _sum: { amount: true } }), prisma.exam.findMany({ where: { startDate: { gte: today } }, include: { class: true }, orderBy: { startDate: "asc" }, take: 5 }), prisma.announcement.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 5 })
    ]);
    return ok(response, { cards: [{ key: "students", label: "Total students", value: students }, { key: "teachers", label: "Total teachers", value: teachers }, { key: "classes", label: "Total classes", value: classes }, { key: "attendance", label: "Present today", value: todayAttendance }, { key: "fees", label: "Pending fees", value: Number(pendingFees._sum.amount || 0), format: "currency" }, { key: "exams", label: "Upcoming exams", value: upcomingExams.length }], upcomingExams, announcements });
  }
  const student = user.role === "STUDENT" ? await prisma.student.findUnique({ where: { userId: user.id }, include: { class: true } }) : null;
  const parent = user.role === "PARENT" ? await prisma.parent.findUnique({ where: { userId: user.id }, include: { children: { include: { class: true } } } }) : null;
  const teacher = user.role === "TEACHER" ? await prisma.teacher.findUnique({ where: { userId: user.id }, include: { classSubjects: { include: { class: true, subject: true } } } }) : null;
  if (user.role === "STUDENT" && !student) throw new AppError(404, "Student profile not found");
  const studentIds = student ? [student.id] : parent ? parent.children.map((child) => child.id) : [];
  const classIds = student ? [student.classId].filter(Boolean) as string[] : parent ? parent.children.map((child) => child.classId).filter(Boolean) as string[] : teacher ? teacher.classSubjects.map((item) => item.classId) : [];
  const [attendance, fees, upcomingExams, announcements, assignments] = await Promise.all([
    studentIds.length ? prisma.attendance.count({ where: { studentId: { in: studentIds }, status: "PRESENT" } }) : Promise.resolve(0),
    studentIds.length ? prisma.fee.aggregate({ where: { studentId: { in: studentIds }, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } }, _sum: { amount: true } }) : Promise.resolve({ _sum: { amount: null } }),
    classIds.length ? prisma.exam.findMany({ where: { classId: { in: classIds }, startDate: { gte: today } }, include: { class: true }, orderBy: { startDate: "asc" }, take: 5 }) : Promise.resolve([]),
    prisma.announcement.findMany({ where: { published: true, OR: [{ audience: null }, { audience: user.role }] }, orderBy: { createdAt: "desc" }, take: 5 }),
    classIds.length ? prisma.assignment.findMany({ where: { classId: { in: classIds } }, include: { subject: true }, orderBy: { dueDate: "asc" }, take: 5 }) : Promise.resolve([])
  ]);
  const cards = user.role === "TEACHER" ? [{ key: "classes", label: "My assigned classes", value: new Set(classIds).size }, { key: "assignments", label: "Active assignments", value: assignments.length }, { key: "exams", label: "Upcoming exams", value: upcomingExams.length }] : [{ key: "children", label: user.role === "PARENT" ? "My children" : "My class", value: user.role === "PARENT" ? studentIds.length : student?.class?.name || "Unassigned" }, { key: "attendance", label: "Present records", value: attendance }, { key: "fees", label: "Pending fees", value: Number(fees._sum.amount || 0), format: "currency" }, { key: "exams", label: "Upcoming exams", value: upcomingExams.length }];
  return ok(response, { cards, profile: student || parent || teacher, upcomingExams, announcements, assignments });
}
