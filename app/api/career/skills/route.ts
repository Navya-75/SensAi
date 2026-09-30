import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { GeminiConfigurationError, GeminiResponseError } from "@/lib/ai/gemini";
import { SkillGapError, generateSkillGap } from "@/lib/skills/skill-gap";
import { consumeAiAllowance } from "@/lib/security/ai-limits";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({ targetRole: z.string().trim().min(2).max(120) }).strict();

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to review skill gaps." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter a target role to continue." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a target role between 2 and 120 characters." }, { status: 400 });

  try {
    const profile = await getSignedInProfile();
    if (!profile || profile.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(profile);
    if (synced.status !== "synced") return NextResponse.json({ error: "Profile storage is not configured yet." }, { status: 503 });
    if (!(await consumeAiAllowance(synced.user.id, "SKILL_GAP", 5))) return NextResponse.json({ error: "You have reached the hourly skill analysis limit. Try again later." }, { status: 429 });
    const result = await generateSkillGap(synced.user.id, parsed.data.targetRole);
    return NextResponse.json({ result }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof SkillGapError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof GeminiConfigurationError) return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }, { status: 503 });
    if (error instanceof GeminiResponseError) return NextResponse.json({ error: "Gemini could not return a valid skill plan. Please try again." }, { status: 502 });
    return NextResponse.json({ error: "SENSAI could not generate this skill-gap plan." }, { status: 502 });
  }
}
