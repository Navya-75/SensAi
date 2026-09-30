import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { MAX_RESUME_BYTES } from "@/lib/resumes/constants";
import { ResumeUploadError, uploadResumeForUser } from "@/lib/resumes/upload";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to upload a resume." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Resume storage is not configured yet." }, { status: 503 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RESUME_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Choose a PDF smaller than 4 MB." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "The upload could not be read. Choose a PDF file and try again." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF file to upload." }, { status: 400 });
  if (file.size > MAX_RESUME_BYTES) return NextResponse.json({ error: "Choose a PDF smaller than 4 MB." }, { status: 413 });

  const profile = await getSignedInProfile();
  if (!profile || profile.clerkUserId !== userId) {
    return NextResponse.json({ error: "Your session could not be verified. Please sign in again." }, { status: 401 });
  }

  let synced;
  try {
    synced = await syncSignedInUser(profile);
  } catch {
    return NextResponse.json({ error: "SENSAI could not connect to profile storage. Try again shortly." }, { status: 503 });
  }
  if (synced.status !== "synced") return NextResponse.json({ error: "Resume storage is not configured yet." }, { status: 503 });

  try {
    const resume = await uploadResumeForUser({
      userId: synced.user.id,
      filename: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    if (error instanceof ResumeUploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "SENSAI could not process this PDF. Please try again." }, { status: 503 });
  }
}
