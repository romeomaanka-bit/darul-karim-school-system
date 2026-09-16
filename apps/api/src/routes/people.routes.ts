import { Router } from "express";
import { allow, authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createParent, createStudent, createTeacher, deleteParent, deleteStudent, deleteTeacher, getParent, getStudent, getTeacher, listParents, listStudents, listTeachers, updateParent, updateStudent, updateTeacher } from "../controllers/people.controller.js";
import { parentSchema, studentSchema, teacherSchema, updatePersonSchema } from "../validators/people.validator.js";

export const peopleRouter = Router();
peopleRouter.use(authenticate);

peopleRouter.route("/students").get(allow("ADMIN", "TEACHER", "STUDENT", "PARENT"), listStudents).post(allow("ADMIN"), validate(studentSchema), createStudent);
peopleRouter.route("/students/:id").get(allow("ADMIN", "TEACHER", "STUDENT", "PARENT"), getStudent).put(allow("ADMIN"), validate(updatePersonSchema), updateStudent).delete(allow("ADMIN"), deleteStudent);
peopleRouter.route("/teachers").get(allow("ADMIN", "TEACHER"), listTeachers).post(allow("ADMIN"), validate(teacherSchema), createTeacher);
peopleRouter.route("/teachers/:id").get(allow("ADMIN", "TEACHER"), getTeacher).put(allow("ADMIN"), validate(updatePersonSchema), updateTeacher).delete(allow("ADMIN"), deleteTeacher);
peopleRouter.route("/parents").get(allow("ADMIN", "PARENT"), listParents).post(allow("ADMIN"), validate(parentSchema), createParent);
peopleRouter.route("/parents/:id").get(allow("ADMIN", "PARENT"), getParent).put(allow("ADMIN"), validate(updatePersonSchema), updateParent).delete(allow("ADMIN"), deleteParent);
