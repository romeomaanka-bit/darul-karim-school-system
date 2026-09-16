import { z } from "zod";

const person = {
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional().nullable(),
  profileImage: z.string().url().optional().nullable()
};

export const studentSchema = z.object({
  ...person,
  rollNumber: z.string().trim().min(3).max(40),
  password: z.string().min(8).max(128),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.coerce.date(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  admissionDate: z.coerce.date().optional(),
  classId: z.string().cuid().optional().nullable(),
  parentId: z.string().cuid().optional().nullable()
});

export const teacherSchema = z.object({
  ...person,
  email: z.string().email(),
  password: z.string().min(8).max(128),
  employeeId: z.string().trim().min(3).max(40),
  qualification: z.string().trim().max(200).optional().nullable(),
  joiningDate: z.coerce.date().optional()
});

export const parentSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable()
});

export const updatePersonSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  profileImage: z.string().url().nullable().optional(),
  classId: z.string().cuid().nullable().optional(),
  parentId: z.string().cuid().nullable().optional(),
  qualification: z.string().trim().max(200).nullable().optional()
}).refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");
