import { Router } from "express";
import { dashboard } from "../controllers/dashboard.controller.js";
import { attendanceReport, feesReport, resultReport, studentReport } from "../controllers/reports.controller.js";
import { authenticate, allow } from "../middleware/auth.js";
import { authRouter } from "./auth.routes.js";
import { peopleRouter } from "./people.routes.js";
import { reportsRouter, resourceRouter } from "./resource.routes.js";

export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use(peopleRouter);
apiRouter.get("/dashboard", authenticate, dashboard);
apiRouter.use(resourceRouter);
reportsRouter.get("/students", studentReport);
reportsRouter.get("/attendance", attendanceReport);
reportsRouter.get("/results", resultReport);
reportsRouter.get("/fees", feesReport);
apiRouter.use("/reports", reportsRouter);
apiRouter.get("/users", authenticate, allow("ADMIN"), async (_request, response) => {
  const { prisma } = await import("../config/prisma.js");
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  response.json({ success: true, data: users });
});
