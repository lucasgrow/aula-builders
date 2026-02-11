import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, comment } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; cardId: string; commentId: string }> };

const updateSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function PATCH(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, commentId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db
    .select()
    .from(comment)
    .where(eq(comment.id, commentId))
    .then((r) => r[0]);

  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  await db
    .update(comment)
    .set({ content: parsed.data.content, updatedAt: new Date() })
    .where(eq(comment.id, commentId));

  const updated = await db
    .select()
    .from(comment)
    .where(eq(comment.id, commentId))
    .then((r) => r[0]);

  return NextResponse.json({ comment: updated });
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, commentId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db
    .select()
    .from(comment)
    .where(eq(comment.id, commentId))
    .then((r) => r[0]);

  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(comment).where(eq(comment.id, commentId));

  return NextResponse.json({ ok: true });
}
