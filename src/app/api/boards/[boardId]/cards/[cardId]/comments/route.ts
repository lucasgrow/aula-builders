import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, comment, users } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; cardId: string }> };

const createSchema = z.object({
  content: z.string().min(1).max(5000),
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

  const id = genId("cmt");

  await db.insert(comment).values({
    id,
    cardId,
    userId: session.user.id!,
    content: parsed.data.content,
  });

  const created = await db
    .select({
      id: comment.id,
      cardId: comment.cardId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(comment)
    .innerJoin(users, eq(comment.userId, users.id))
    .where(eq(comment.id, id))
    .then((r) => r[0]);

  return NextResponse.json({ comment: created }, { status: 201 });
}
