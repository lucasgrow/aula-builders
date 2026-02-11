import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, label } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().min(1).max(50),
});

export async function GET(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const labels = await db
    .select()
    .from(label)
    .where(eq(label.boardId, boardId));

  return NextResponse.json({ labels });
}

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

  const id = genId("lbl");

  await db.insert(label).values({
    id,
    boardId,
    name: parsed.data.name,
    color: parsed.data.color,
  });

  const created = await db
    .select()
    .from(label)
    .where(eq(label.id, id))
    .then((r) => r[0]);

  return NextResponse.json({ label: created }, { status: 201 });
}
