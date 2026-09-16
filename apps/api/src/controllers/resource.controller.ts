import type { Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedRequest } from "../types.js";
import { AppError } from "../utils/app-error.js";
import { ok, paginated } from "../utils/api-response.js";
import { audit } from "../services/audit.service.js";

export type ResourceKey = "classes" | "subjects" | "classSubjects" | "attendance" | "timetable" | "exams" | "examSubjects" | "results" | "fees" | "payments" | "assignments" | "announcements" | "complaints" | "submissions" | "events" | "settings" | "auditLogs";
type ResourceConfig = {
  delegate: string;
  readRoles: Role[];
  writeRoles: Role[];
  include?: Record<string, unknown>;
  search?: string[];
  orderBy?: Record<string, string> | Record<string, string>[];
};

const userSelect = { select: { id: true, email: true, role: true } };
export const resources: Record<ResourceKey, ResourceConfig> = {
  classes: { delegate: "class", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN"], include: { classSubjects: { include: { subject: true, teacher: true } }, _count: { select: { students: true } } }, search: ["name", "code"], orderBy: { name: "asc" } },
  subjects: { delegate: "subject", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN"], include: { classSubjects: { include: { class: true, teacher: true } } }, search: ["name", "code"], orderBy: { name: "asc" } },
  classSubjects: { delegate: "classSubject", readRoles: ["ADMIN", "TEACHER"], writeRoles: ["ADMIN"], include: { class: true, subject: true, teacher: true }, orderBy: { classId: "asc" } },
  attendance: { delegate: "attendance", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN", "TEACHER"], include: { student: { include: { class: true } }, class: true, markedBy: true }, orderBy: { date: "desc" } },
  timetable: { delegate: "timetable", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN"], include: { class: true, subject: true, teacher: true }, orderBy: [{ day: "asc" }, { startTime: "asc" }] },
  exams: { delegate: "exam", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN", "TEACHER"], include: { class: true, subjects: { include: { subject: true } } }, search: ["title"], orderBy: { startDate: "asc" } },
  examSubjects: { delegate: "examSubject", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN", "TEACHER"], include: { exam: { include: { class: true } }, subject: true }, orderBy: { examDate: "asc" } },
  results: { delegate: "result", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN", "TEACHER"], include: { student: { include: { class: true } }, examSubject: { include: { exam: true, subject: true } } }, orderBy: { updatedAt: "desc" } },
  fees: { delegate: "fee", readRoles: ["ADMIN", "STUDENT", "PARENT"], writeRoles: ["ADMIN"], include: { student: { include: { class: true } }, payments: true }, search: ["title"], orderBy: { dueDate: "asc" } },
  payments: { delegate: "payment", readRoles: ["ADMIN", "STUDENT", "PARENT"], writeRoles: ["ADMIN"], include: { student: true, fee: true }, orderBy: { paidAt: "desc" } },
  assignments: { delegate: "assignment", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN", "TEACHER"], include: { class: true, subject: true, teacher: true, submissions: true }, search: ["title"], orderBy: { dueDate: "asc" } },
  announcements: { delegate: "announcement", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN", "TEACHER"], include: { author: userSelect }, search: ["title", "body"], orderBy: { createdAt: "desc" } },
  complaints: { delegate: "complaint", readRoles: ["ADMIN", "STUDENT", "PARENT"], writeRoles: ["ADMIN", "STUDENT", "PARENT"], include: { author: userSelect, student: true, resolvedBy: userSelect }, search: ["subject", "message"], orderBy: { updatedAt: "desc" } },
  submissions: { delegate: "submission", readRoles: ["ADMIN", "TEACHER", "STUDENT"], writeRoles: ["STUDENT"], include: { assignment: { include: { class: true, subject: true } }, student: true }, orderBy: { submittedAt: "desc" } },
  events: { delegate: "event", readRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], writeRoles: ["ADMIN"], orderBy: { startAt: "asc" } },
  settings: { delegate: "schoolSetting", readRoles: ["ADMIN"], writeRoles: ["ADMIN"], orderBy: { key: "asc" } },
  auditLogs: { delegate: "auditLog", readRoles: ["ADMIN"], writeRoles: [], include: { user: userSelect }, orderBy: { createdAt: "desc" } }
};

const client = prisma as unknown as Record<string, any>;

async function scopeFor(key: ResourceKey, user: NonNullable<AuthenticatedRequest["user"]>) {
  if (user.role === "ADMIN") return {};
  const studentLink = { userId: user.id };
  const childLink = { parent: { userId: user.id } };
  const teacherClass = { classSubjects: { some: { teacher: { userId: user.id } } } };
  switch (key) {
    case "classes": return user.role === "TEACHER" ? teacherClass : { students: { some: user.role === "STUDENT" ? studentLink : childLink } };
    case "subjects": return user.role === "TEACHER" ? { classSubjects: { some: { teacher: { userId: user.id } } } } : { classSubjects: { some: { class: { students: { some: user.role === "STUDENT" ? studentLink : childLink } } } } };
    case "classSubjects": return { teacher: { userId: user.id } };
    case "attendance": return user.role === "TEACHER" ? { class: teacherClass } : { student: user.role === "STUDENT" ? studentLink : childLink };
    case "timetable": return user.role === "TEACHER" ? { teacher: { userId: user.id } } : { class: { students: { some: user.role === "STUDENT" ? studentLink : childLink } } };
    case "exams": return user.role === "TEACHER" ? { class: teacherClass } : { class: { students: { some: user.role === "STUDENT" ? studentLink : childLink } } };
    case "examSubjects": return user.role === "TEACHER" ? { exam: { class: teacherClass } } : { exam: { class: { students: { some: user.role === "STUDENT" ? studentLink : childLink } } } };
    case "results": return user.role === "TEACHER" ? { student: { class: teacherClass } } : { student: user.role === "STUDENT" ? studentLink : childLink };
    case "fees": return { student: user.role === "STUDENT" ? studentLink : childLink };
    case "payments": return { student: user.role === "STUDENT" ? studentLink : childLink };
    case "assignments": return user.role === "TEACHER" ? { teacher: { userId: user.id } } : { class: { students: { some: user.role === "STUDENT" ? studentLink : childLink } } };
    case "announcements": return { published: true, OR: [{ audience: null }, { audience: user.role }] };
    case "complaints": return { authorId: user.id };
    case "submissions": return user.role === "STUDENT" ? { student: studentLink } : { assignment: { teacher: { userId: user.id } } };
    case "events": return { OR: [{ audience: null }, { audience: user.role }] };
    default: return { id: "__no_access__" };
  }
}

function pageValues(request: AuthenticatedRequest) {
  return { page: Math.max(1, Number(request.query.page) || 1), limit: Math.min(100, Math.max(1, Number(request.query.limit) || 20)), search: String(request.query.search || "").trim() };
}

export function assertResourceRole(key: ResourceKey, mode: "read" | "write") {
  return (request: AuthenticatedRequest, _response: Response, next: (error?: unknown) => void) => {
    const roles = mode === "read" ? resources[key].readRoles : resources[key].writeRoles;
    if (!request.user || !roles.includes(request.user.role)) return next(new AppError(403, "You do not have permission to access this register"));
    next();
  };
}

export async function listResource(key: ResourceKey, request: AuthenticatedRequest, response: Response) {
  const config = resources[key];
  const { page, limit, search } = pageValues(request);
  const scope = await scopeFor(key, request.user!);
  const searchFilter = search && config.search ? { OR: config.search.map((field) => ({ [field]: { contains: search, mode: "insensitive" } })) } : {};
  const where = { AND: [scope, searchFilter] };
  const delegate = client[config.delegate];
  const [items, total] = await Promise.all([delegate.findMany({ where, include: config.include, orderBy: config.orderBy, skip: (page - 1) * limit, take: limit }), delegate.count({ where })]);
  return paginated(response, items, page, limit, total);
}

async function findAccessible(key: ResourceKey, id: string, request: AuthenticatedRequest) {
  const config = resources[key];
  return client[config.delegate].findFirst({ where: { AND: [{ id }, await scopeFor(key, request.user!)] }, include: config.include });
}

async function prepareData(key: ResourceKey, request: AuthenticatedRequest, isCreate: boolean) {
  const data = { ...(request.body as Record<string, unknown>) };
  if (key === "attendance" && request.user!.role === "TEACHER" && isCreate) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: request.user!.id } });
    if (!teacher) throw new AppError(403, "Teacher profile not found");
    data.markedById = teacher.id;
  }
  if (key === "assignments" && request.user!.role === "TEACHER" && isCreate) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: request.user!.id } });
    data.teacherId = teacher?.id;
  }
  if (key === "announcements" && isCreate) data.authorId = request.user!.id;
  if (key === "complaints") {
    if (isCreate) {
      data.authorId = request.user!.id;
      if (request.user!.role === "STUDENT") data.studentId = (await prisma.student.findUnique({ where: { userId: request.user!.id } }))?.id;
    }
    if (!isCreate && request.user!.role === "ADMIN" && (data.status === "RESOLVED" || data.status === "CLOSED")) data.resolvedById = request.user!.id;
  }
  if (key === "submissions" && isCreate) {
    const student = await prisma.student.findUnique({ where: { userId: request.user!.id } });
    if (!student) throw new AppError(403, "Student profile not found");
    data.studentId = student.id;
    data.status = "SUBMITTED";
    data.submittedAt = new Date();
  }
  return data;
}

async function refreshFeeStatus(feeId: string) {
  const fee = await prisma.fee.findUnique({ where: { id: feeId }, include: { payments: true } });
  if (!fee) return;
  const paid = fee.payments.reduce((total, payment) => total + Number(payment.amount), 0);
  const status = paid >= Number(fee.amount) ? "PAID" : paid > 0 ? "PARTIAL" : fee.dueDate < new Date() ? "OVERDUE" : "PENDING";
  await prisma.fee.update({ where: { id: feeId }, data: { status } });
}

export async function createResource(key: ResourceKey, request: AuthenticatedRequest, response: Response) {
  const config = resources[key];
  const data = await prepareData(key, request, true);
  if (key === "payments") {
    const fee = await prisma.fee.findUnique({ where: { id: String(data.feeId) } });
    if (!fee || fee.studentId !== data.studentId) throw new AppError(422, "Payment student must match the fee owner");
  }
  const item = await client[config.delegate].create({ data, include: config.include });
  if (key === "payments") await refreshFeeStatus(item.feeId);
  await audit(request.user, "CREATE", key.toUpperCase(), item.id);
  return ok(response, item, 201);
}

export async function getResource(key: ResourceKey, request: AuthenticatedRequest, response: Response) {
  const item = await findAccessible(key, String(request.params.id), request);
  if (!item) throw new AppError(404, "Record not found");
  return ok(response, item);
}

export async function updateResource(key: ResourceKey, request: AuthenticatedRequest, response: Response) {
  const existing = await findAccessible(key, String(request.params.id), request);
  if (!existing) throw new AppError(404, "Record not found");
  const data = await prepareData(key, request, false);
  const item = await client[resources[key].delegate].update({ where: { id: String(request.params.id) }, data, include: resources[key].include });
  if (key === "payments") await refreshFeeStatus(item.feeId);
  await audit(request.user, "UPDATE", key.toUpperCase(), item.id);
  return ok(response, item);
}

export async function deleteResource(key: ResourceKey, request: AuthenticatedRequest, response: Response) {
  if (request.user!.role !== "ADMIN") throw new AppError(403, "Only administrators can delete records");
  const existing = await findAccessible(key, String(request.params.id), request);
  if (!existing) throw new AppError(404, "Record not found");
  await client[resources[key].delegate].delete({ where: { id: String(request.params.id) } });
  if (key === "payments") await refreshFeeStatus(existing.feeId);
  await audit(request.user, "DELETE", key.toUpperCase(), String(request.params.id));
  return response.status(204).send();
}

export async function listNotifications(request: AuthenticatedRequest, response: Response) {
  const { page, limit } = pageValues(request);
  const where = { userId: request.user!.id };
  const [items, total] = await Promise.all([prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }), prisma.notification.count({ where })]);
  return paginated(response, items, page, limit, total);
}

export async function markNotificationRead(request: AuthenticatedRequest, response: Response) {
  const item = await prisma.notification.findFirst({ where: { id: String(request.params.id), userId: request.user!.id } });
  if (!item) throw new AppError(404, "Notification not found");
  return ok(response, await prisma.notification.update({ where: { id: item.id }, data: { isRead: true } }));
}

async function canAccessStudent(studentId: string, request: AuthenticatedRequest) {
  const user = request.user!;
  if (user.role === "ADMIN") return true;
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { class: { include: { classSubjects: { include: { teacher: true } } } }, parent: true } });
  if (!student) return false;
  if (user.role === "STUDENT") return student.userId === user.id;
  if (user.role === "PARENT") return student.parent?.userId === user.id;
  return student.class?.classSubjects.some((item) => item.teacher?.userId === user.id) ?? false;
}

export async function attendanceForStudent(request: AuthenticatedRequest, response: Response) {
  if (!(await canAccessStudent(String(request.params.studentId), request))) throw new AppError(403, "You cannot view this student's attendance");
  const records = await prisma.attendance.findMany({ where: { studentId: String(request.params.studentId) }, include: { class: true, markedBy: true }, orderBy: { date: "desc" } });
  return ok(response, records);
}

export async function resultsForStudent(request: AuthenticatedRequest, response: Response) {
  if (!(await canAccessStudent(String(request.params.studentId), request))) throw new AppError(403, "You cannot view this student's results");
  const records = await prisma.result.findMany({ where: { studentId: String(request.params.studentId) }, include: { examSubject: { include: { exam: true, subject: true } } }, orderBy: { updatedAt: "desc" } });
  return ok(response, records);
}
