import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth/user";
import { syncSignedInUser } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: { id: string } };
const updateSchema = z.object({ completed: z.boolean() }).strict();

export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to update roadmap progress." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "The progress update was not valid." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose whether to complete this task." }, { status: 400 });

  try {
    const identity = await getSignedInProfile();
    if (!identity || identity.clerkUserId !== userId) return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
    const synced = await syncSignedInUser(identity);
    if (synced.status !== "synced") return NextResponse.json({ error: "Roadmap storage is not configured." }, { status: 503 });
    const task = await prisma.roadmapTask.findFirst({
      where: { id: params.id, phase: { roadmap: { userId: synced.user.id } } },
      select: { id: true, status: true, phase: { select: { roadmapId: true } } },
    });
    if (!task) return NextResponse.json({ error: "Roadmap task not found." }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.roadmapTask.update({
        where: { id: task.id },
        data: { status: parsed.data.completed ? "COMPLETED" : "NOT_STARTED", completedAt: parsed.data.completed ? new Date() : null },
        select: { id: true, status: true },
      });
      const [total, completed] = await Promise.all([
        tx.roadmapTask.count({ where: { phase: { roadmapId: task.phase.roadmapId } } }),
        tx.roadmapTask.count({ where: { phase: { roadmapId: task.phase.roadmapId }, status: "COMPLETED" } }),
      ]);
      await tx.progressTracking.create({ data: { userId: synced.user.id, category: "ROADMAP", metricKey: "roadmap_completion", value: completed, target: total, sourceId: task.phase.roadmapId } });
      await tx.userActivity.create({ data: { userId: synced.user.id, type: "ROADMAP_TASK_COMPLETED", summary: parsed.data.completed ? "Roadmap task completed" : "Roadmap task reopened", referenceType: "roadmap", referenceId: task.phase.roadmapId } });
      return saved;
    });
    return NextResponse.json({ task: updated });
  } catch {
    return NextResponse.json({ error: "SENSAI could not save roadmap progress." }, { status: 503 });
  }
}
