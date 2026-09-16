import { Router } from "express";
import { changePassword, login, logout, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, passwordSchema } from "../validators/auth.validator.js";

export const authRouter = Router();
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);
authRouter.post("/change-password", authenticate, validate(passwordSchema), changePassword);
