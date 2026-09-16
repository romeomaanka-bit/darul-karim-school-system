import { Router, type NextFunction, type Response } from "express";
import { z } from "zod";
import { authenticate, allow } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";
import { assertResourceRole, attendanceForStudent, createResource, deleteResource, getResource, listNotifications, listResource, markNotificationRead, resources, resultsForStudent, updateResource } from "../controllers/resource.controller.js";
import { notificationReadSchema, resourceSchemas } from "../validators/resource.validator.js";

export const resourceRouter = Router();
resourceRouter.use(authenticate);

function validateResource(key: keyof typeof resources, isUpdate = false) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    const schema = resourceSchemas[key as keyof typeof resourceSchemas] as z.ZodType | undefined;
    if (!schema) return next();
    if (!isUpdate) request.body = schema.parse(request.body);
    else request.body = z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update").parse(request.body);
    next();
  };
}

function attach(key: keyof typeof resources, path: string) {
  resourceRouter.route(path)
    .get(assertResourceRole(key, "read"), (request, response) => listResource(key, request, response))
    .post(assertResourceRole(key, "write"), validateResource(key), (request, response) => createResource(key, request, response));
  resourceRouter.route(`${path}/:id`)
    .get(assertResourceRole(key, "read"), (request, response) => getResource(key, request, response))
    .put(assertResourceRole(key, "write"), validateResource(key, true), (request, response) => updateResource(key, request, response))
    .delete(assertResourceRole(key, "write"), (request, response) => deleteResource(key, request, response));
}

attach("classes", "/classes");
attach("subjects", "/subjects");
attach("classSubjects", "/class-subjects");
resourceRouter.get("/attendance/student/:studentId", assertResourceRole("attendance", "read"), attendanceForStudent);
attach("attendance", "/attendance");
attach("timetable", "/timetable");
attach("exams", "/exams");
attach("examSubjects", "/exam-subjects");
resourceRouter.get("/results/student/:studentId", assertResourceRole("results", "read"), resultsForStudent);
attach("results", "/results");
attach("fees", "/fees");
attach("payments", "/payments");
attach("assignments", "/assignments");
attach("announcements", "/announcements");
attach("complaints", "/complaints");
attach("submissions", "/submissions");
attach("events", "/events");
attach("settings", "/settings");
attach("auditLogs", "/audit-logs");

resourceRouter.get("/notifications", listNotifications);
resourceRouter.put("/notifications/:id/read", (request, response, next) => { request.body = notificationReadSchema.parse(request.body); next(); }, markNotificationRead);
resourceRouter.get("/health", (_request, response) => response.json({ success: true, data: { status: "ok" } }));

export const reportsRouter = Router();
reportsRouter.use(authenticate, allow("ADMIN", "TEACHER"));
