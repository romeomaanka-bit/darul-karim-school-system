import type { NextFunction, Response } from "express";
import type { ZodType } from "zod";
import type { AuthenticatedRequest } from "../types.js";

export const validate = (schema: ZodType) => (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
  request.body = schema.parse(request.body);
  next();
};
