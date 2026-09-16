import type { NextFunction, Response } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../utils/app-error.js";
import { verifyToken } from "../utils/jwt.js";
import type { AuthenticatedRequest } from "../types.js";

export function authenticate(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  const value = request.header("authorization");
  if (!value?.startsWith("Bearer ")) return next(new AppError(401, "Authentication is required"));
  try {
    request.user = verifyToken(value.slice(7));
    next();
  } catch {
    next(new AppError(401, "Your session is invalid or has expired"));
  }
}

export function allow(...roles: Role[]) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    if (!request.user) return next(new AppError(401, "Authentication is required"));
    if (!roles.includes(request.user.role)) return next(new AppError(403, "You do not have permission to perform this action"));
    next();
  };
}
