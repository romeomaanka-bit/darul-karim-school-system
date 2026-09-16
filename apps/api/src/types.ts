import type { Role } from "@prisma/client";
import type { Request } from "express";

export type AuthUser = { id: string; role: Role; email: string | null };

export type AuthenticatedRequest = Request & { user?: AuthUser };
