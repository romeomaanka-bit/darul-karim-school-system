import bcrypt from "bcryptjs";
import type { Response } from "express";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedRequest } from "../types.js";
import { AppError } from "../utils/app-error.js";
import { ok } from "../utils/api-response.js";
import { signToken } from "../utils/jwt.js";
import { audit } from "../services/audit.service.js";

const userInclude = { student: { include: { class: true, parent: true } }, teacher: true, parent: { include: { children: true } } } as const;

function safeUser(user: Awaited<ReturnType<typeof prisma.user.findUnique>> & Record<string, unknown>) {
  const { passwordHash: _passwordHash, ...safe } = user as { passwordHash: string } & Record<string, unknown>;
  return safe;
}

export async function login(request: AuthenticatedRequest, response: Response) {
  const { identifier, password } = request.body as { identifier: string; password: string };
  const normalized = identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: normalized }, { student: { rollNumber: { equals: identifier.trim(), mode: "insensitive" } } }] },
    include: userInclude
  });

  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  console.log("[DK_LOGIN_DEBUG]", {
    identifier: normalized,
    userFound: !!user,
    isActive: user?.isActive ?? false,
    passwordMatches
  });

  if (!user || !user.isActive || !passwordMatches) {
    throw new AppError(401, "Invalid credentials");
  }
  const token = signToken({ id: user.id, role: user.role, email: user.email });
  await audit({ id: user.id, role: user.role, email: user.email }, "LOGIN", "SESSION");
  return ok(response, { accessToken: token, user: safeUser(user) });
}

export async function logout(request: AuthenticatedRequest, response: Response) {
  await audit(request.user, "LOGOUT", "SESSION");
  return ok(response, { message: "You have been signed out" });
}

export async function me(request: AuthenticatedRequest, response: Response) {
  const user = await prisma.user.findUnique({ where: { id: request.user!.id }, include: userInclude });
  if (!user || !user.isActive) throw new AppError(401, "Your account is no longer active");
  return ok(response, safeUser(user));
}

export async function changePassword(request: AuthenticatedRequest, response: Response) {
  const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };
  const user = await prisma.user.findUnique({ where: { id: request.user!.id } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new AppError(400, "Your current password is incorrect");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  await audit(request.user, "CHANGE_PASSWORD", "USER", user.id);
  return ok(response, { message: "Password changed successfully" });
}
