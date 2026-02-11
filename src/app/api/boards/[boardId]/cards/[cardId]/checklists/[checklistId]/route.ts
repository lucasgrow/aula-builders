import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, checklist, checklistItem } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; cardId: string; checklistId: string }> };

const updateSchema = z.object({
  title: z.string().min(1).max(500),
});

export async function PATCH(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, checklistId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db
    .select()
    .from(checklist)
    .where(eq(checklist.id, checklistId))
    .then((r) => r[0]);

  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  await db
    .update(checklist)
    .set({ title: parsed.data.title })
    .where(eq(checklist.id, checklistId));

  const updated = await db
    .select()
    .from(checklist)
    .where(eq(checklist.id, checklistId))
    .then((r) => r[0]);

  return NextResponse.json({ checklist: updated });
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, checklistId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db
    .select()
    .from(checklist)
    .where(eq(checklist.id, checklistId))
    .then((r) => r[0]);

  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cascade: delete items first, then checklist
  await db.delete(checklistItem).where(eq(checklistItem.checklistId, checklistId));
  await db.delete(checklist).where(eq(checklist.id, checklistId));

  return NextResponse.json({ ok: true });
}
