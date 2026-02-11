import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, cardLabel } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; cardId: string }> };

const bodySchema = z.object({
  labelId: z.string().min(1),
});

export async function POST(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, cardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const id = genId("cla");

  await db.insert(cardLabel).values({
    id,
    cardId,
    labelId: parsed.data.labelId,
  });

  const created = await db
    .select()
    .from(cardLabel)
    .where(eq(cardLabel.id, id))
    .then((r) => r[0]);

  return NextResponse.json({ cardLabel: created }, { status: 201 });
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, cardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  await db
    .delete(cardLabel)
    .where(and(eq(cardLabel.cardId, cardId), eq(cardLabel.labelId, parsed.data.labelId)));

  return NextResponse.json({ ok: true });
}
