import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, list } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string }> };

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
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

  // Update each list's position to its index in the array
  for (let i = 0; i < parsed.data.orderedIds.length; i++) {
    await db
      .update(list)
      .set({ position: i })
      .where(eq(list.id, parsed.data.orderedIds[i]));
  }

  return NextResponse.json({ ok: true });
}
