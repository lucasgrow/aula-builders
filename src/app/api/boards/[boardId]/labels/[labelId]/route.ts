import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, label } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; labelId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().min(1).max(50).optional(),
});

export async function PATCH(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, labelId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db
    .select()
    .from(label)
    .where(eq(label.id, labelId))
    .then((r) => r[0]);

  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const updates: Record<string, any> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.color !== undefined) updates.color = parsed.data.color;

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  await db.update(label).set(updates).where(eq(label.id, labelId));

  const updated = await db
    .select()
    .from(label)
    .where(eq(label.id, labelId))
    .then((r) => r[0]);

  return NextResponse.json({ label: updated });
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, labelId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db
    .select()
    .from(label)
    .where(eq(label.id, labelId))
    .then((r) => r[0]);

  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(label).where(eq(label.id, labelId));

  return NextResponse.json({ ok: true });
}
