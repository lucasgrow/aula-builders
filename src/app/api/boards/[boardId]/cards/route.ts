import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, card } from "@/server/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string }> };

const createSchema = z.object({
  listId: z.string().min(1),
  title: z.string().min(1).max(500),
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

  // Get max position in the target list
  const maxPos = await db
    .select({ max: sql<number>`coalesce(max(${card.position}), -1)` })
    .from(card)
    .where(eq(card.listId, parsed.data.listId))
    .then((r) => r[0]?.max ?? -1);

  const cardId = genId("crd");

  await db.insert(card).values({
    id: cardId,
    listId: parsed.data.listId,
    title: parsed.data.title,
    position: maxPos + 1,
  });

  const created = await db
    .select()
    .from(card)
    .where(eq(card.id, cardId))
    .then((r) => r[0]);

  return NextResponse.json({ card: created }, { status: 201 });
}
