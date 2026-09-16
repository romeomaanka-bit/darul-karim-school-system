import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function main() {
  const [adminHash, teacherHash, studentHash, parentHash] = await Promise.all(["Admin123!", "Teacher123!", "Student123!", "Parent123!"].map((password) => bcrypt.hash(password, 12)));
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.result.deleteMany();
  await prisma.examSubject.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.schoolSetting.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({ data: { email: "admin@darulkarim.edu", passwordHash: adminHash, role: Role.ADMIN } });
  const parentUser = await prisma.user.create({ data: { email: "parent@darulkarim.edu", passwordHash: parentHash, role: Role.PARENT } });
  const parent = await prisma.parent.create({ data: { userId: parentUser.id, firstName: "Amina", lastName: "Hassan", phone: "+252 61 234 5678", address: "Mogadishu" } });
  const teacherUser = await prisma.user.create({ data: { email: "teacher@darulkarim.edu", passwordHash: teacherHash, role: Role.TEACHER } });
  const teacher = await prisma.teacher.create({ data: { userId: teacherUser.id, employeeId: "DK-T-001", firstName: "Yusuf", lastName: "Ali", phone: "+252 61 987 6543", qualification: "B.Ed Mathematics", joiningDate: day("2024-08-01") } });
  const classSeven = await prisma.class.create({ data: { name: "Grade 7", section: "A", code: "G7-A", academicYear: "2026-2027", capacity: 35 } });
  const mathematics = await prisma.subject.create({ data: { name: "Mathematics", code: "MATH-7", description: "Core mathematics for Grade 7" } });
  const science = await prisma.subject.create({ data: { name: "Science", code: "SCI-7", description: "Integrated science for Grade 7" } });
  await prisma.classSubject.createMany({ data: [{ classId: classSeven.id, subjectId: mathematics.id, teacherId: teacher.id }, { classId: classSeven.id, subjectId: science.id, teacherId: teacher.id }] });
  const studentUser = await prisma.user.create({ data: { passwordHash: studentHash, role: Role.STUDENT } });
  const student = await prisma.student.create({ data: { userId: studentUser.id, rollNumber: "DK-1001", firstName: "Abdullahi", lastName: "Mohamed", gender: "MALE", dateOfBirth: day("2013-04-18"), admissionDate: day("2025-09-01"), phone: "+252 61 123 4567", address: "Mogadishu", classId: classSeven.id, parentId: parent.id } });
  await prisma.enrollment.create({ data: { studentId: student.id, classId: classSeven.id, academicYear: "2026-2027" } });
  await prisma.attendance.createMany({ data: [{ studentId: student.id, classId: classSeven.id, date: day("2026-09-13"), status: "PRESENT", markedById: teacher.id }, { studentId: student.id, classId: classSeven.id, date: day("2026-09-14"), status: "LATE", markedById: teacher.id }] });
  await prisma.timetable.createMany({ data: [{ classId: classSeven.id, subjectId: mathematics.id, teacherId: teacher.id, day: "MONDAY", startTime: "08:00", endTime: "09:00", room: "A-07" }, { classId: classSeven.id, subjectId: science.id, teacherId: teacher.id, day: "WEDNESDAY", startTime: "09:15", endTime: "10:15", room: "Lab 1" }] });
  const exam = await prisma.exam.create({ data: { classId: classSeven.id, title: "First Term Assessment", startDate: day("2026-10-12"), endDate: day("2026-10-16"), description: "First term assessments" } });
  const examSubject = await prisma.examSubject.create({ data: { examId: exam.id, subjectId: mathematics.id, examDate: day("2026-10-12"), maxMarks: 100, passingMarks: 50 } });
  await prisma.result.create({ data: { studentId: student.id, examSubjectId: examSubject.id, marks: 86, grade: "A", remarks: "Strong progress" } });
  const fee = await prisma.fee.create({ data: { studentId: student.id, title: "Term 1 tuition", amount: 150, dueDate: day("2026-10-01"), status: "PARTIAL" } });
  await prisma.payment.create({ data: { feeId: fee.id, studentId: student.id, amount: 50, paidAt: day("2026-09-10"), method: "Cash", reference: "DK-P-0001" } });
  const assignment = await prisma.assignment.create({ data: { classId: classSeven.id, subjectId: mathematics.id, teacherId: teacher.id, title: "Fractions practice", description: "Complete questions 1–20 in your maths workbook.", dueDate: day("2026-09-20") } });
  await prisma.submission.create({ data: { assignmentId: assignment.id, studentId: student.id, content: "Completed in workbook", status: "SUBMITTED", submittedAt: new Date("2026-09-14T09:00:00.000Z") } });
  await prisma.announcement.create({ data: { title: "Welcome to the 2026–2027 school year", body: "Classes begin with a full timetable this week.", authorId: admin.id, published: true } });
  await prisma.notification.create({ data: { userId: studentUser.id, title: "New assignment", body: "Fractions practice is due on 20 September." } });
  await prisma.event.create({ data: { title: "Parent–teacher meeting", description: "Term opening meeting", startAt: new Date("2026-09-25T09:00:00.000Z"), location: "Main hall" } });
  await prisma.schoolSetting.createMany({ data: [{ key: "school_name", value: "Darul-Karim School System" }, { key: "academic_year", value: "2026-2027" }] });
  console.log("Seeded Darul-Karim development data.");
}

main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
