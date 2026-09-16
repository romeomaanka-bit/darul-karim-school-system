import { z } from "zod";

const id = z.string().cuid();
const date = z.coerce.date();

export const resourceSchemas = {
  classes: z.object({ name: z.string().trim().min(1), code: z.string().trim().min(2), section: z.string().trim().optional().nullable(), academicYear: z.string().trim().min(4), capacity: z.coerce.number().int().min(1).max(500).optional() }),
  subjects: z.object({ name: z.string().trim().min(1), code: z.string().trim().min(2), description: z.string().trim().max(1000).optional().nullable() }),
  classSubjects: z.object({ classId: id, subjectId: id, teacherId: id.optional().nullable() }),
  attendance: z.object({ studentId: id, classId: id.optional().nullable(), date, status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]), remarks: z.string().trim().max(500).optional().nullable() }),
  timetable: z.object({ classId: id, subjectId: id, teacherId: id.optional().nullable(), day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]), startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), room: z.string().trim().max(50).optional().nullable() }),
  exams: z.object({ classId: id, title: z.string().trim().min(1), startDate: date, endDate: date, description: z.string().trim().max(1000).optional().nullable() }).refine((data) => data.endDate >= data.startDate, "End date must be on or after start date"),
  examSubjects: z.object({ examId: id, subjectId: id, examDate: date, maxMarks: z.coerce.number().positive(), passingMarks: z.coerce.number().nonnegative() }).refine((data) => data.passingMarks <= data.maxMarks, "Passing marks cannot exceed maximum marks"),
  results: z.object({ studentId: id, examSubjectId: id, marks: z.coerce.number().nonnegative(), grade: z.string().trim().max(8).optional().nullable(), remarks: z.string().trim().max(500).optional().nullable() }),
  fees: z.object({ studentId: id, title: z.string().trim().min(1), amount: z.coerce.number().positive(), dueDate: date, status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]).optional(), notes: z.string().trim().max(500).optional().nullable() }),
  payments: z.object({ feeId: id, studentId: id, amount: z.coerce.number().positive(), paidAt: date.optional(), method: z.string().trim().max(50).optional().nullable(), reference: z.string().trim().max(100).optional().nullable(), notes: z.string().trim().max(500).optional().nullable() }),
  assignments: z.object({ classId: id, subjectId: id, teacherId: id.optional().nullable(), title: z.string().trim().min(1), description: z.string().trim().min(1).max(5000), dueDate: date }),
  announcements: z.object({ title: z.string().trim().min(1), body: z.string().trim().min(1).max(5000), audience: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]).optional().nullable(), published: z.boolean().optional() }),
  complaints: z.object({ subject: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(5000), studentId: id.optional().nullable(), status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]).optional(), resolution: z.string().trim().max(5000).optional().nullable() }),
  events: z.object({ title: z.string().trim().min(1), description: z.string().trim().max(5000).optional().nullable(), startAt: date, endAt: date.optional().nullable(), location: z.string().trim().max(200).optional().nullable(), audience: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]).optional().nullable() }),
  settings: z.object({ key: z.string().trim().min(1).max(100), value: z.string().trim().max(10000) }),
  submissions: z.object({ assignmentId: id, content: z.string().trim().max(10000).optional().nullable(), attachment: z.string().url().optional().nullable() })
};

export const notificationReadSchema = z.object({ isRead: z.literal(true) });
