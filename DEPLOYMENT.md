# Production deployment

## Required services and configuration

- A Node.js host compatible with Next.js 14 and Node 22.13 or newer.
- Clerk production application keys and allowed origin/redirect URLs.
- PostgreSQL with a pooled application URL in `DATABASE_URL` and a direct migration URL in `DIRECT_URL`.
- A server-side `GEMINI_API_KEY` for model features. `GEMINI_MODEL` is optional.
- PostgreSQL-backed private resume storage (`STORAGE_PROVIDER=database`). Resume PDFs are stored in the same PostgreSQL database as their private account records; no separate object-storage account is required.
- `NEXT_PUBLIC_APP_URL` set to the canonical HTTPS origin.

## Release steps

1. Add secrets and service URLs in the host's protected environment configuration.
2. Run `npm ci`, `npm run db:generate`, and `npm run db:validate` during the build pipeline.
3. Apply committed database changes with `npm run db:deploy` as a release step before serving the new version.
4. Build with `npm run build` and serve with `npm start`.
5. Verify authentication, resume upload/download/delete, consent settings, one Gemini request per enabled feature, job filtering, practice attempt persistence, and account ownership boundaries.
6. Check `https://<origin>/robots.txt` and `/sitemap.xml`; only the public home page is listed.

Do not run `npm run db:seed` against production unless demo content is intentionally wanted. Seeded job entries are fictional examples.

### Render configuration for PostgreSQL resume storage

In the Render web service's Environment settings, set:

- `STORAGE_PROVIDER=database`
- `DATABASE_URL` to the hosted PostgreSQL URL used by the running app
- `DIRECT_URL` to the direct PostgreSQL URL used to apply Prisma migrations

The migration adds a nullable `BYTEA` column to `Resume`; apply it before deploying the version that reads and writes PDF bytes. Set Render's build command to `npm ci && npm run db:generate && npm run db:deploy && npm run build`, or run `npm run db:deploy` as a release step before the app starts. Uploaded PDFs are limited to 4 MB and count toward the PostgreSQL plan's storage quota.

## Voice support

Voice interviews rely on the browser's Web Speech Recognition API. It is not supported consistently across browsers, and a browser may use a remote speech service. Users can switch to text interviews when voice recognition is unavailable or denied.

## Current verification boundary

This workspace can run static checks and local tests. Production credentials and database access are not available here, so live service connectivity and deployment behavior must be verified after environment configuration.
