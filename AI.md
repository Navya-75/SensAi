# Gemini and AI features

AI features run only on the server through Google's official `@google/genai` SDK. Resume analysis, target-role skill gaps, roadmap generation, resume summary suggestions, cover letters, mock interview questions, answer evaluation, and final reports validate structured model responses before use. Routes verify the signed-in account and check the AI processing preference before calling Gemini.

Set `GEMINI_API_KEY` in the server environment. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`. Never prefix the key with `NEXT_PUBLIC_` or expose it to browser code. Copy the variable names from `.env.example` into your local or deployment environment.

Resume analysis sends extracted text only after AI processing is allowed. Validated results are saved in `ResumeAnalysis` for history. Extracted facts include supporting text; role directions and ATS recommendations are labeled as coaching suggestions.

Roadmaps, role skill gaps, resume suggestions, cover letters, and interviews have separate per-user hourly limits stored as `AiUsageEvent` rows. Resume analysis has its own limit of five per user per hour. An attempted AI request consumes its reservation before the provider call, including when the provider fails.

Users can turn AI processing off under **Settings → Privacy and AI**. Existing saved records remain available; the preference prevents new processing. Browser voice input may be processed by its configured speech service. SENSAI stores submitted transcript text, not microphone audio.
