import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to view career resources." }, { status: 401 });
  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Career resource storage is not configured." }, { status: 503 });
    const items = await prisma.industryInsight.findMany({ orderBy: [{ publishedAt: "desc" }, { title: "asc" }], take: 50 });
    return NextResponse.json({ items: items.map((item) => ({ ...item, publishedAt: item.publishedAt?.toISOString() ?? null })) }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch { return NextResponse.json({ error: "SENSAI could not load career resources." }, { status: 503 }); }
}
