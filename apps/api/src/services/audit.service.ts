import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types.js";

export async function audit(user: AuthUser | undefined, action: string, entity: string, entityId?: string, metadata?: unknown) {
  await prisma.auditLog.create({ data: { userId: user?.id, action, entity, entityId, metadata: metadata as never } });
}
