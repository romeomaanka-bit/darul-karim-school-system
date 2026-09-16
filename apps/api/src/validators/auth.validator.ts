import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or roll number"),
  password: z.string().min(8, "Password must contain at least 8 characters")
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8, "New password must contain at least 8 characters")
});
