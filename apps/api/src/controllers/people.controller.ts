import bcrypt from "bcryptjs";
import type { Response } from "express";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedRequest } from "../types.js";
import { AppError } from "../utils/app-error.js";
import { ok, paginated } from "../utils/api-response.js";
import { audit } from "../services/audit.service.js";

const pageValues = (request: AuthenticatedRequest) => ({
  page: Math.max(1, Number(request.query.page) || 1),
  limit: Math.min(100, Math.max(1, Number(request.query.limit) || 20)),
  search: String(request.query.search || "").trim()
});

export async function listStudents(request: AuthenticatedRequest, response: Response) {
  const { page, limit, search } = pageValues(request);
  const user = request.user!;
  const roleWhere = user.role === "STUDENT" ? { userId: user.id } : user.role === "PARENT" ? { parent: { userId: user.id } } : user.role === "TEACHER" ? { class: { classSubjects: { some: { teacher: { userId: user.id } } } } } : {};
  const where = { ...roleWhere, ...(search ? { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }, { rollNumber: { contains: search, mode: "insensitive" as const } }] } : {}) };
  const [items, total] = await Promise.all([
    prisma.student.findMany({ where, include: { class: true, parent: true, user: { select: { email: true, isActive: true } } }, skip: (page - 1) * limit, take: limit, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    prisma.student.count({ where })
  ]);
  return paginated(response, items, page, limit, total);
}

export async function createStudent(request: AuthenticatedRequest, response: Response) {
  const { password, ...studentData } = request.body as Record<string, unknown> & { password: string };
  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { role: "STUDENT", passwordHash: await bcrypt.hash(password, 12) } });
    return tx.student.create({ data: { ...studentData, userId: user.id } as never, include: { class: true, parent: true, user: { select: { email: true } } } });
  });
  await audit(request.user, "CREATE", "STUDENT", student.id);
  return ok(response, student, 201);
}

export async function getStudent(request: AuthenticatedRequest, response: Response) {
  const student = await prisma.student.findUnique({ where: { id: String(request.params.id) }, include: { class: true, parent: true, attendance: { orderBy: { date: "desc" }, take: 30 }, results: { include: { examSubject: { include: { exam: true, subject: true } } } }, fees: { include: { payments: true } }, user: { select: { email: true, isActive: true } } } });
  if (!student) throw new AppError(404, "Student not found");
  const user = request.user!;
  const isOwnStudent = user.role === "STUDENT" && student.userId === user.id;
  const isOwnChild = user.role === "PARENT" && (await prisma.parent.findFirst({ where: { userId: user.id, children: { some: { id: student.id } } } }));
  if (user.role !== "ADMIN" && user.role !== "TEACHER" && !isOwnStudent && !isOwnChild) throw new AppError(403, "You cannot view this student");
  return ok(response, student);
}

export async function updateStudent(request: AuthenticatedRequest, response: Response) {
  const student = await prisma.student.update({ where: { id: String(request.params.id) }, data: request.body, include: { class: true, parent: true } });
  await audit(request.user, "UPDATE", "STUDENT", student.id);
  return ok(response, student);
}

export async function deleteStudent(request: AuthenticatedRequest, response: Response) {
  const student = await prisma.student.findUnique({ where: { id: String(request.params.id) } });
  if (!student) throw new AppError(404, "Student not found");
  await prisma.user.delete({ where: { id: student.userId } });
  await audit(request.user, "DELETE", "STUDENT", student.id);
  return response.status(204).send();
}

export async function listTeachers(request: AuthenticatedRequest, response: Response) {
  const { page, limit, search } = pageValues(request);
  const user = request.user!;
  const where = { ...(user.role === "TEACHER" ? { userId: user.id } : {}), ...(search ? { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }, { employeeId: { contains: search, mode: "insensitive" as const } }] } : {}) };
  const [items, total] = await Promise.all([prisma.teacher.findMany({ where, include: { classSubjects: { include: { class: true, subject: true } }, user: { select: { email: true, isActive: true } } }, skip: (page - 1) * limit, take: limit }), prisma.teacher.count({ where })]);
  return paginated(response, items, page, limit, total);
}

export async function createTeacher(request: AuthenticatedRequest, response: Response) {
  const { email, password, ...teacherData } = request.body as Record<string, unknown> & { email: string; password: string };
  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: email.toLowerCase(), role: "TEACHER", passwordHash: await bcrypt.hash(password, 12) } });
    return tx.teacher.create({ data: { ...teacherData, userId: user.id } as never, include: { user: { select: { email: true } } } });
  });
  await audit(request.user, "CREATE", "TEACHER", teacher.id);
  return ok(response, teacher, 201);
}

export async function getTeacher(request: AuthenticatedRequest, response: Response) {
  const teacher = await prisma.teacher.findUnique({ where: { id: String(request.params.id) }, include: { classSubjects: { include: { class: true, subject: true } }, timetables: { include: { class: true, subject: true } }, assignments: true, user: { select: { email: true, isActive: true } } } });
  if (!teacher) throw new AppError(404, "Teacher not found");
  if (request.user!.role === "TEACHER" && teacher.userId !== request.user!.id) throw new AppError(403, "You cannot view this teacher");
  return ok(response, teacher);
}

export async function updateTeacher(request: AuthenticatedRequest, response: Response) {
  const teacher = await prisma.teacher.update({ where: { id: String(request.params.id) }, data: request.body });
  await audit(request.user, "UPDATE", "TEACHER", teacher.id);
  return ok(response, teacher);
}

export async function deleteTeacher(request: AuthenticatedRequest, response: Response) {
  const teacher = await prisma.teacher.findUnique({ where: { id: String(request.params.id) } });
  if (!teacher) throw new AppError(404, "Teacher not found");
  await prisma.user.delete({ where: { id: teacher.userId } });
  await audit(request.user, "DELETE", "TEACHER", teacher.id);
  return response.status(204).send();
}

export async function listParents(request: AuthenticatedRequest, response: Response) {
  const { page, limit, search } = pageValues(request);
  const where = { ...(request.user!.role === "PARENT" ? { userId: request.user!.id } : {}), ...(search ? { OR: [{ firstName: { contains: search, mode: "insensitive" as const } }, { lastName: { contains: search, mode: "insensitive" as const } }, { user: { email: { contains: search, mode: "insensitive" as const } } }] } : {}) };
  const [items, total] = await Promise.all([prisma.parent.findMany({ where, include: { children: { include: { class: true } }, user: { select: { email: true, isActive: true } } }, skip: (page - 1) * limit, take: limit }), prisma.parent.count({ where })]);
  return paginated(response, items, page, limit, total);
}

export async function createParent(request: AuthenticatedRequest, response: Response) {
  const { email, password, ...parentData } = request.body as Record<string, unknown> & { email: string; password: string };
  const parent = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: email.toLowerCase(), role: "PARENT", passwordHash: await bcrypt.hash(password, 12) } });
    return tx.parent.create({ data: { ...parentData, userId: user.id } as never, include: { user: { select: { email: true } }, children: true } });
  });
  await audit(request.user, "CREATE", "PARENT", parent.id);
  return ok(response, parent, 201);
}

export async function getParent(request: AuthenticatedRequest, response: Response) {
  const parent = await prisma.parent.findUnique({ where: { id: String(request.params.id) }, include: { children: { include: { class: true, attendance: { orderBy: { date: "desc" }, take: 30 }, results: { include: { examSubject: { include: { subject: true, exam: true } } } } } }, user: { select: { email: true, isActive: true } } } });
  if (!parent) throw new AppError(404, "Parent not found");
  if (request.user!.role === "PARENT" && parent.userId !== request.user!.id) throw new AppError(403, "You cannot view this parent");
  return ok(response, parent);
}

export async function updateParent(request: AuthenticatedRequest, response: Response) {
  const parent = await prisma.parent.update({ where: { id: String(request.params.id) }, data: request.body, include: { children: true } });
  await audit(request.user, "UPDATE", "PARENT", parent.id);
  return ok(response, parent);
}

export async function deleteParent(request: AuthenticatedRequest, response: Response) {
  const parent = await prisma.parent.findUnique({ where: { id: String(request.params.id) } });
  if (!parent) throw new AppError(404, "Parent not found");
  await prisma.user.delete({ where: { id: parent.userId } });
  await audit(request.user, "DELETE", "PARENT", parent.id);
  return response.status(204).send();
}
