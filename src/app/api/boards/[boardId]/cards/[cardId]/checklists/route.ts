import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, checklist } from "@/server/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; cardId: string }> };

const createSchema = z.object({
  title: z.string().min(1).max(500),
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const maxPos = await db
    .select({ max: sql<number>`coalesce(max(${checklist.position}), -1)` })
    .from(checklist)
    .where(eq(checklist.cardId, cardId))
    .then((r) => r[0]?.max ?? -1);

  const id = genId("chk");

  await db.insert(checklist).values({
    id,
    cardId,
    title: parsed.data.title,
    position: maxPos + 1,
  });

  const created = await db
    .select()
    .from(checklist)
    .where(eq(checklist.id, id))
    .then((r) => r[0]);

  return NextResponse.json({ checklist: created }, { status: 201 });
}
