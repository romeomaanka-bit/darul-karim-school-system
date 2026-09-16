# Database

Prisma targets PostgreSQL. `User` is the authentication root and has exactly one optional role profile: `Student`, `Teacher`, or `Parent`; an administrator needs only a `User` row. Student logins use `Student.rollNumber`, which is unique. Other roles use unique user emails.

Academic structure is `Class → ClassSubject → Subject/Teacher`; students retain both a current `classId` and historical `Enrollment` rows. Attendance has one row per student/date. Exams own `ExamSubject` rows, and a result is unique per student/exam-subject.

Financial data flows from `Fee` to `Payment`. The API recalculates fee status after payment create, update, or delete. Assignment submissions are unique per assignment/student.

All principal tables use CUID primary keys, timestamps, foreign keys and the indexes declared in [schema.prisma](../prisma/schema.prisma). Cascades remove dependent school records when their owning profile is intentionally deleted; relations such as current class or resolver use `SetNull` to preserve history when appropriate.

Create schema and initial migration with:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```
