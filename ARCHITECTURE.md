# Architecture

## Application layers

- **Next.js App Router** provides public landing and authentication pages, signed-in career tools, and route handlers.
- **Clerk** authenticates requests. Middleware protects app pages; each API route verifies the Clerk identity and resolves the corresponding SENSAI user.
- **Prisma and PostgreSQL** store profiles, normalized skills, uploaded-resume metadata and analysis, roadmaps, job matches, builder documents, letters, interviews, practice attempts, activity, and AI usage limits.
- **Google Gemini** is called from server-only modules. Structured responses are validated before display or persistence.
- **Private storage adapters** keep resume files outside public web paths. The local adapter is for development; deployments should use a private S3-compatible bucket.
- **Browser speech recognition** is an optional voice input adapter. No raw microphone audio is uploaded or stored by SENSAI.

## Request and data flow

1. A user signs in through Clerk and completes the profile stored in PostgreSQL.
2. Protected UI calls an authenticated route handler. The handler validates the request, verifies account ownership, and checks AI consent before any model call.
3. AI routes apply database-backed hourly limits, call the configured server-side Gemini SDK, validate JSON with Zod, and persist records where the feature has saved history.
4. Pages read only the signed-in user's records. APIs that return private data disable shared caching.

## Useful locations

- `app/`: App Router pages and API routes
- `components/`: interactive feature interfaces
- `lib/ai/`: Gemini client, prompts, and schemas
- `lib/skills/`, `lib/jobs/`, `lib/security/`: career rules and server controls
- `prisma/schema.prisma`, `prisma/migrations/`: persisted data shape and migrations
- `prisma/seed.mjs`: explicitly demo-only practice, reference, and job records

See `DATABASE.md` for setup, `AI.md` for model behavior, and `SECURITY.md` for trust boundaries.
