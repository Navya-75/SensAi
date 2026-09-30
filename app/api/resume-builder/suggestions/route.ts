import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { GeminiConfigurationError, GeminiResponseError, generateGeminiStructuredOutput } from "@/lib/ai/gemini";
import { resumeBuilderSuggestionJsonSchema, resumeBuilderSuggestionSchema } from "@/lib/ai/schemas/resume-builder-suggestion";
import { isAiProcessingAllowed } from "@/lib/privacy/ai-consent";
import { resumeSectionsSchema } from "@/lib/validation/resume-builder";
import { consumeAiAllowance } from "@/lib/security/ai-limits";

export const runtime = "nodejs";
export const maxDuration = 60;
const instruction = `You are SENSAI, an accurate resume editor. Suggest a concise professional summary using only facts that appear in the supplied resume sections. Never create employers, degrees, dates, skills, metrics, achievements, or experience. If the information is insufficient to draft a truthful summary, return an empty summarySuggestion and explain what the user could add in notes. Suggestions are editable drafts, not verified facts. Return only the schema JSON.`;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to get resume suggestions." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The resume data was not valid." }, { status: 400 }); }
  const sections = resumeSectionsSchema.safeParse(body);
  if (!sections.success) return NextResponse.json({ error: "Save or correct the resume sections before requesting a suggestion." }, { status: 400 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Resume builder storage is not configured." }, { status: 503 });
    if (!(await isAiProcessingAllowed(synced.user.id))) return NextResponse.json({ error: "AI processing is turned off in your privacy settings." }, { status: 403 });
    if (!(await consumeAiAllowance(synced.user.id, "RESUME_SUGGESTION", 5))) return NextResponse.json({ error: "You have reached the hourly resume suggestion limit. Try again later." }, { status: 429 });
    const generated = await generateGeminiStructuredOutput({
      input: JSON.stringify(sections.data),
      systemInstruction: instruction,
      responseSchema: resumeBuilderSuggestionJsonSchema,
      validator: resumeBuilderSuggestionSchema,
      maxOutputTokens: 2048,
    });
    return NextResponse.json({ suggestion: generated.result }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof GeminiConfigurationError) return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
    if (error instanceof GeminiResponseError) return NextResponse.json({ error: "Gemini could not return a valid suggestion." }, { status: 502 });
    return NextResponse.json({ error: "SENSAI could not create a resume suggestion." }, { status: 502 });
  }
}
