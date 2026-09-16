import type { Response } from "express";

export function ok(response: Response, data: unknown, status = 200) {
  return response.status(status).json({ success: true, data });
}

export function paginated(response: Response, data: unknown, page: number, limit: number, total: number) {
  return ok(response, { items: data, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
}
