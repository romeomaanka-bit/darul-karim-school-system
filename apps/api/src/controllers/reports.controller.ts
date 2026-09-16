import type { Response } from "express";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedRequest } from "../types.js";
import { ok } from "../utils/api-response.js";

export async function studentReport(_request: AuthenticatedRequest, response: Response) {
  const [total, byClass] = await Promise.all([prisma.student.count(), prisma.class.findMany({ include: { _count: { select: { students: true } } }, orderBy: { name: "asc" } })]);
  return ok(response, { total, byClass: byClass.map((item) => ({ class: item.name, code: item.code, students: item._count.students })) });
}

export async function attendanceReport(_request: AuthenticatedRequest, response: Response) {
  const grouped = await prisma.attendance.groupBy({ by: ["status"], _count: { _all: true } });
  return ok(response, { totals: grouped.map((item) => ({ status: item.status, count: item._count._all })) });
}

export async function resultReport(_request: AuthenticatedRequest, response: Response) {
  const results = await prisma.result.findMany({ include: { student: true, examSubject: { include: { subject: true, exam: true } } }, orderBy: { updatedAt: "desc" } });
  return ok(response, results);
}

export async function feesReport(_request: AuthenticatedRequest, response: Response) {
  const [byStatus, received] = await Promise.all([prisma.fee.groupBy({ by: ["status"], _sum: { amount: true }, _count: { _all: true } }), prisma.payment.aggregate({ _sum: { amount: true } })]);
  return ok(response, { received: Number(received._sum.amount || 0), totals: byStatus.map((item) => ({ status: item.status, count: item._count._all, amount: Number(item._sum.amount || 0) })) });
}
