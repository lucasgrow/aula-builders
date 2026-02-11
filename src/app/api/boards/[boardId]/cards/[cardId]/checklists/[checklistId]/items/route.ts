import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, checklistItem } from "@/server/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; cardId: string; checklistId: string }> };

const createSchema = z.object({
  title: z.string().min(1).max(500),
});

export async function POST(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, checklistId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const maxPos = await db
    .select({ max: sql<number>`coalesce(max(${checklistItem.position}), -1)` })
    .from(checklistItem)
    .where(eq(checklistItem.checklistId, checklistId))
    .then((r) => r[0]?.max ?? -1);

  const id = genId("chi");

  await db.insert(checklistItem).values({
    id,
    checklistId,
    title: parsed.data.title,
    position: maxPos + 1,
  });

  const created = await db
    .select()
    .from(checklistItem)
    .where(eq(checklistItem.id, id))
    .then((r) => r[0]);

  return NextResponse.json({ item: created }, { status: 201 });
}
