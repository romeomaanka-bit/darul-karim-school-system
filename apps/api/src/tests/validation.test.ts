import { describe, expect, it } from "vitest";
import { loginSchema } from "../validators/auth.validator.js";
import { resourceSchemas } from "../validators/resource.validator.js";
import { signToken, verifyToken } from "../utils/jwt.js";

describe("authentication validation", () => {
  it("rejects an incomplete login", () => expect(() => loginSchema.parse({ identifier: "DK" })).toThrow());
  it("creates and verifies a signed role token", () => { const token = signToken({ id: "user-1", role: "STUDENT", email: null }); expect(verifyToken(token)).toMatchObject({ id: "user-1", role: "STUDENT" }); });
});

describe("school register validation", () => {
  it("requires a complete class", () => expect(() => resourceSchemas.classes.parse({ name: "Grade 7" })).toThrow());
  it("rejects invalid attendance status", () => expect(() => resourceSchemas.attendance.parse({ studentId: "ckabcdefghijklmnopqrstuv", date: "2026-09-15", status: "AWAY" })).toThrow());
  it("rejects exams ending before they begin", () => expect(() => resourceSchemas.exams.parse({ classId: "ckabcdefghijklmnopqrstuv", title: "Term test", startDate: "2026-10-10", endDate: "2026-10-01" })).toThrow());
  it("rejects results with a missing student and exam subject", () => expect(() => resourceSchemas.results.parse({ marks: 81 })).toThrow());
  it("rejects a non-positive fee amount", () => expect(() => resourceSchemas.fees.parse({ studentId: "ckabcdefghijklmnopqrstuv", title: "Tuition", amount: 0, dueDate: "2026-10-01" })).toThrow());
  it("requires assignment instructions", () => expect(() => resourceSchemas.assignments.parse({ classId: "ckabcdefghijklmnopqrstuv", subjectId: "ckabcdefghijklmnopqrstuw", title: "Practice", dueDate: "2026-10-01" })).toThrow());
});
