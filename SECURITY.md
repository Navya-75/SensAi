# Security and privacy notes

## Authentication and account ownership

- Clerk protects signed-in pages. Route handlers independently require an authenticated Clerk user and map that identity to a SENSAI user.
- Queries for user-owned records include the owning `userId`. A guessed record ID alone does not grant access.
- Resume files use a private storage adapter; do not place uploaded content under `public/` or return storage keys to browsers.

## AI requests

- AI requests run server-side. API keys must never use a `NEXT_PUBLIC_` name.
- AI processing preferences are checked before Gemini is called. Structured output is schema-validated.
- Hourly usage events limit roadmaps (3), skill gaps (5), resume suggestions (5), cover letters (5), interview starts (5), interview evaluations (15), and final interview reports (5) per user. Resume analysis has its own limit of five per hour. Failed provider calls also consume a reservation so repeated failures cannot be used to bypass the limit.
- Resume text, interview answers, and cover-letter evidence are private user data and must not be written to logs.

## Browser and transport controls

The app sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a Permissions Policy that disables camera/geolocation while allowing same-origin microphone use for optional voice input. Private API responses use `Cache-Control: private, no-store` where they return user data.

## Voice input

Voice recognition is performed by the browser or its configured speech service. SENSAI receives and stores only the editable text transcript submitted by the user. The app does not claim that browser speech recognition is processed locally.

## Before production

- Use HTTPS, production Clerk keys, a managed PostgreSQL database, and a private S3-compatible bucket.
- Set least-privilege storage credentials and restrict bucket access to the application.
- Configure backups, log redaction, alerting, and a process for handling deletion requests.
- Apply migrations with `npm run db:deploy`; do not use development migration commands in production.
- Configure an explicit production `NEXT_PUBLIC_APP_URL` and verify the deployed Clerk, Gemini, database, and storage connections.
