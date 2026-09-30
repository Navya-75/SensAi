# Database setup

SENSAI uses PostgreSQL through Prisma ORM. Neon is the intended hosted provider. The application uses a pooled connection for runtime queries and a direct connection for Prisma migrations.

## Configure local connection strings

Copy `.env.example` to `.env.local` and keep the Clerk values created by Clerk setup. Add both database URLs from your Neon project:

- `DATABASE_URL`: Neon pooled connection string for application queries. Select the pooled endpoint (its host includes `-pooler`).
- `DIRECT_URL`: Neon direct, non-pooled connection string for schema migrations.

Keep both URLs private. Do not commit `.env.local` or paste database credentials into source files.

## Prisma commands

```sh
npm install
npm run db:generate
npm run db:validate
npm run db:migrate
```

Use `npm run db:deploy` in deployment environments to apply committed migrations. `npm run db:studio` opens Prisma Studio for local inspection.
Run `npm run db:seed` for explicitly fictional job listings, multiple-choice practice questions, and links to primary documentation. Demo jobs are not live vacancies, and reference links are not dated industry news.

The initial SQL migration is generated from `prisma/schema.prisma`. It has not been applied to a Neon database because this workspace does not have a database connection configured.

## Data ownership

Application users are keyed by their Clerk user ID. User-owned rows relate back to `User` and use cascading deletes when an account is removed. Public reference data such as skills, jobs, industry insights, and MCQs is separate from user-owned records. Server code must still verify ownership whenever it reads a child record by ID; a relationship in the schema does not replace authorization checks.

Resume file contents and interview answers are private user data. Do not include them in logs or public responses. MCQ queries must select the answer key only after a user submits an attempt.

`AiUsageEvent` stores only the user, feature name, and timestamp required for database-backed hourly AI limits; it does not store prompts or model responses.
