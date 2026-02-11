import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, card } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string }> };

const reorderSchema = z.object({
  cards: z.array(
    z.object({
      id: z.string(),
      listId: z.string(),
      position: z.number().int().min(0),
    })
  ).min(1),
});

export async function PATCH(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  // Batch update each card's position and listId
  for (const c of parsed.data.cards) {
    await db
      .update(card)
      .set({ listId: c.listId, position: c.position })
      .where(eq(card.id, c.id));
  }

  return NextResponse.json({ ok: true });
}
