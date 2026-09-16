# Darul-Karim School System

Production-oriented school management monorepo with a Next.js web dashboard, Express/Prisma/PostgreSQL API, and native Java Android app. Both clients use the same protected REST API.

## Prerequisites

- Node.js 22+ and npm 10+
- Docker Desktop (recommended for PostgreSQL), or PostgreSQL 16+
- Android Studio (for `apps/android`)

## Install and run

```bash
cd darul-karim-school-system
cp .env.example .env
npm install
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

Web runs at `http://localhost:3000`; API runs at `http://localhost:4000/api`. To run the services separately use `npm run dev -w @darul-karim/api` and `npm run dev -w @darul-karim/web`.

## Local development credentials

These seeded passwords are development-only and must be changed for a real deployment:

| Role | Identifier | Password |
| --- | --- | --- |
| Administrator | `admin@darulkarim.edu` | `Admin123!` |
| Teacher | `teacher@darulkarim.edu` | `Teacher123!` |
| Student | `DK-1001` | `Student123!` |
| Parent | `parent@darulkarim.edu` | `Parent123!` |

## Tests and build

```bash
npm run test
npm run lint
npm run build
```

The test suite checks JWT authentication and invalid/missing fields across login, class, attendance, exam, result, fee and assignment request validators. Run API integration tests against a dedicated PostgreSQL test database before deployment.

## Android Studio

Open `apps/android` in Android Studio and allow Gradle to sync. The emulator default API is `http://10.0.2.2:4000/api/`, which points to your host machine. For a physical device, pass your LAN URL when building:

```bash
./gradlew :app:assembleDebug -PAPI_BASE_URL=http://YOUR-LAN-IP:4000/api/
```

The Android app stores only the token, role and display name using encrypted preferences. It never connects directly to PostgreSQL.

## Configuration and security

Copy `.env.example` to `.env`. Set a unique, long `JWT_SECRET`, production `DATABASE_URL`, and comma-separated `CORS_ORIGIN` values. Do not commit `.env`. Express applies Helmet, CORS allow-listing, rate limiting, bcrypt hashing, JWT authentication, centralized errors, Zod validation, Prisma parameterization, audit logs, and role/record authorization.

See [architecture](docs/architecture.md), [database](docs/database.md), and [API reference](docs/api.md).
