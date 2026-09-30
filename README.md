# SENSAI — AI Career Coach

SENSAI is a Next.js career workspace for resume analysis, skill-gap exploration, career roadmaps, job matching, resume drafting, cover letters, and interview practice.

## Local setup

Requirements: Node.js 22.13 or newer, npm, and PostgreSQL. Clerk and Gemini keys are needed for sign-in and AI features.

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in Clerk keys, `DATABASE_URL`, and `DIRECT_URL`. Add `GEMINI_API_KEY` to enable AI features. Keep secrets server-side and out of source control.
3. Generate and check the Prisma client with `npm run db:generate` and `npm run db:validate`.
4. Apply migrations locally with `npm run db:migrate`.
5. Load clearly labeled sample questions, reference docs, and fictional job listings with `npm run db:seed`.
6. Start the app with `npm run dev` and open `http://localhost:3000`.

The seed command writes demo-only records. It does not represent real job openings, current industry news, or salary data.

## Common commands

```sh
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm run db:validate
npm run db:deploy
```

## Product notes

- AI processing can be disabled under Settings. Resume analysis, cover letters, roadmaps, role skill gaps, interview questions/evaluations, and resume suggestions are sent to the configured Gemini API after consent is checked.
- Job matching uses an explainable profile score. Seeded listings are fictional and labeled as demos; live job data requires a configured provider.
- Voice practice uses browser speech recognition when available. The browser or its configured speech service may process microphone input; SENSAI stores submitted text transcripts, not microphone audio.
- See [DATABASE.md](DATABASE.md), [AI.md](AI.md), [SECURITY.md](SECURITY.md), and [DEPLOYMENT.md](DEPLOYMENT.md) for operational details.
