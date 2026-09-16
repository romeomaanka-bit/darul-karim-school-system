# REST API

Every successful response is `{ "success": true, "data": ... }`; errors are `{ "success": false, "message": "..." }`. Send `Authorization: Bearer <accessToken>` after login. List endpoints accept `page`, `limit`, and where applicable `search`.

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password` |
| People | CRUD `/api/students`, `/api/teachers`, `/api/parents` |
| Academic setup | CRUD `/api/classes`, `/subjects`, `/class-subjects`, `/timetable`, `/exams`, `/exam-subjects` |
| Student records | CRUD `/api/attendance`, `/results`, `/assignments`, `/submissions`; `GET /attendance/student/:studentId`; `GET /results/student/:studentId` |
| Finance | list/create/update `/api/fees`, CRUD `/api/payments` |
| Communication | CRUD `/api/announcements`, `/complaints`; `GET /api/notifications`; `PUT /api/notifications/:id/read` |
| Administration | CRUD `/api/events`, `/settings`; `GET /api/audit-logs`, `/api/users`, `/api/dashboard` |
| Reports | `GET /api/reports/students`, `/attendance`, `/results`, `/fees` |

Create, update, and delete permissions are role guarded. Deletes are administrator-only. The exact accepted payloads are Zod schemas in `apps/api/src/validators` and are the source of truth for clients.

Example login:

```json
POST /api/auth/login
{ "identifier": "DK-1001", "password": "Student123!" }
```
