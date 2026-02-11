import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, list } from "@/server/db";
import { eq, and, asc, sql } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lists = await db
    .select()
    .from(list)
    .where(and(eq(list.boardId, boardId), eq(list.isArchived, false)))
    .orderBy(asc(list.position));

  return NextResponse.json({ lists });
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
});

export async function POST(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  // Get max position
  const maxPos = await db
    .select({ max: sql<number>`coalesce(max(${list.position}), -1)` })
    .from(list)
    .where(eq(list.boardId, boardId))
    .then((r) => r[0]?.max ?? -1);

  const listId = genId("lst");

  await db.insert(list).values({
    id: listId,
    boardId,
    title: parsed.data.title,
    position: maxPos + 1,
  });

  const created = await db
    .select()
    .from(list)
    .where(eq(list.id, listId))
    .then((r) => r[0]);

  return NextResponse.json({ list: created }, { status: 201 });
}
