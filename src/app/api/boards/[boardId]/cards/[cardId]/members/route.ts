import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, cardMember } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; cardId: string }> };

const bodySchema = z.object({
  userId: z.string().min(1),
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

  const id = genId("cmb");

  await db.insert(cardMember).values({
    id,
    cardId,
    userId: parsed.data.userId,
  });

  const created = await db
    .select()
    .from(cardMember)
    .where(eq(cardMember.id, id))
    .then((r) => r[0]);

  return NextResponse.json({ cardMember: created }, { status: 201 });
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
    .delete(cardMember)
    .where(and(eq(cardMember.cardId, cardId), eq(cardMember.userId, parsed.data.userId)));

  return NextResponse.json({ ok: true });
}
