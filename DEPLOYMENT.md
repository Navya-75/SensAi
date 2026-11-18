# Production deployment

## Required services and configuration

- A Node.js host compatible with Next.js 14 and Node 22.13 or newer.
- Clerk production application keys and allowed origin/redirect URLs.
- PostgreSQL with a pooled application URL in `DATABASE_URL` and a direct migration URL in `DIRECT_URL`.
- A server-side `GEMINI_API_KEY` for model features. `GEMINI_MODEL` is optional.
- Private S3-compatible object storage for uploaded resumes (`STORAGE_PROVIDER=s3`, bucket, region, and credentials). Do not use local file storage on ephemeral production hosts.
- `NEXT_PUBLIC_APP_URL` set to the canonical HTTPS origin.

## Release steps

1. Add secrets and service URLs in the host's protected environment configuration.
2. Run `npm ci`, `npm run db:generate`, and `npm run db:validate` during the build pipeline.
3. Apply committed database changes with `npm run db:deploy` as a release step.
4. Build with `npm run build` and serve with `npm start`.
5. Verify authentication, resume upload/download/delete, consent settings, one Gemini request per enabled feature, job filtering, practice attempt persistence, and account ownership boundaries.
6. Check `https://<origin>/robots.txt` and `/sitemap.xml`; only the public home page is listed.

Do not run `npm run db:seed` against production unless demo content is intentionally wanted. Seeded job entries are fictional examples.

### Cloudflare R2 on Render (no AWS account required)

R2 uses the same S3-compatible API as the existing storage adapter. In the Render web service's Environment settings, configure:

- `STORAGE_PROVIDER=s3`
- `S3_BUCKET` to the exact R2 bucket name
- `S3_REGION=auto`
- `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` from an R2 token scoped to that bucket with Object Read & Write access
- `S3_FORCE_PATH_STYLE=false`

Keep the bucket private. After changing these values, use Render's **Save and deploy** option. If a write fails, Render logs include `Private resume storage write failed` and safe presence flags for the required settings; they never include the secret key value.

## Voice support

Voice interviews rely on the browser's Web Speech Recognition API. It is not supported consistently across browsers, and a browser may use a remote speech service. Users can switch to text interviews when voice recognition is unavailable or denied.

## Current verification boundary

This workspace can run static checks and local tests. Production credentials and database access are not available here, so live service connectivity and deployment behavior must be verified after environment configuration.
