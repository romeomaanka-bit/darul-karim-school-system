import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

export const notFound: RequestHandler = (request, _response, next) => next(new AppError(404, `Route ${request.method} ${request.originalUrl} was not found`));

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) return response.status(422).json({ success: false, message: "Validation failed", details: error.flatten() });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return response.status(409).json({ success: false, message: "A record with this value already exists" });
    if (error.code === "P2025") return response.status(404).json({ success: false, message: "The requested record was not found" });
  }
  if (error instanceof AppError) return response.status(error.statusCode).json({ success: false, message: error.message, ...(error.details ? { details: error.details } : {}) });
  console.error(error);
  return response.status(500).json({ success: false, message: "An unexpected server error occurred" });
};
