# Architecture

Darul-Karim is a monorepo with three clients around one API contract:

```text
Next.js web ─┐
             ├─ HTTPS REST API (Express + JWT + RBAC) ─ Prisma ─ PostgreSQL
Android Java ┘
```

`apps/api` owns all authorization and persistence. Neither the browser nor Android app receives database credentials. Each request carries a JWT bearer token; Express authenticates it, applies role checks and record scoping, validates body data with Zod, performs the Prisma operation, and writes mutating activity to `AuditLog`.

The web app uses Next.js App Router. Client-only components handle the bearer session, API calls, searchable paginated registers, and form feedback. Server route files remain small and pass serializable props only.

The Android app is native Java/XML. Retrofit talks only to the REST API through an OkHttp bearer interceptor. The access token, role and display name are stored through `EncryptedSharedPreferences`; no password is saved on device.

Role boundaries are enforced at the API, not only in navigation. Administrators manage all records; teachers are scoped to their assigned class subjects; students are scoped to their own records; parents are scoped to linked children.
