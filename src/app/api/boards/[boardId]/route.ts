import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  getDb,
  board,
  boardMember,
  list,
  card,
  label,
  cardLabel,
  cardMember,
  users,
} from "@/server/db";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { z } from "zod";
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

  // Board data
  const boardData = await db
    .select()
    .from(board)
    .where(eq(board.id, boardId))
    .then((r) => r[0]);

  if (!boardData)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Lists (non-archived, ordered by position)
  const lists = await db
    .select()
    .from(list)
    .where(and(eq(list.boardId, boardId), eq(list.isArchived, false)))
    .orderBy(asc(list.position));

  // Cards for each list (non-archived, ordered by position)
  const listsWithCards = [];
  for (const l of lists) {
    const cards = await db
      .select()
      .from(card)
      .where(and(eq(card.listId, l.id), eq(card.isArchived, false)))
      .orderBy(asc(card.position));

    // For each card, get labels and member count
    const cardsWithMeta = [];
    for (const c of cards) {
      const cardLabels = await db
        .select({
          id: label.id,
          name: label.name,
          color: label.color,
        })
        .from(cardLabel)
        .innerJoin(label, eq(cardLabel.labelId, label.id))
        .where(eq(cardLabel.cardId, c.id));

      const memberCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(cardMember)
        .where(eq(cardMember.cardId, c.id))
        .then((r) => r[0]);

      cardsWithMeta.push({
        ...c,
        labels: cardLabels,
        memberCount: memberCountResult?.count ?? 0,
      });
    }

    listsWithCards.push({
      ...l,
      cards: cardsWithMeta,
    });
  }

  // Board members with user info
  const members = await db
    .select({
      id: boardMember.id,
      boardId: boardMember.boardId,
      userId: boardMember.userId,
      role: boardMember.role,
      createdAt: boardMember.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(boardMember)
    .innerJoin(users, eq(boardMember.userId, users.id))
    .where(eq(boardMember.boardId, boardId));

  // Board labels
  const labels = await db
    .select()
    .from(label)
    .where(eq(label.boardId, boardId));

  return NextResponse.json({
    board: boardData,
    lists: listsWithCards,
    members,
    labels,
  });
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  background: z.string().max(50).optional(),
  isClosed: z.boolean().optional(),
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

  // Only owner or admin can update
  if (access.role !== "owner" && access.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const updates: Record<string, any> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.background !== undefined) updates.background = parsed.data.background;
  if (parsed.data.isClosed !== undefined) updates.isClosed = parsed.data.isClosed;

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  await db.update(board).set(updates).where(eq(board.id, boardId));

  const updated = await db
    .select()
    .from(board)
    .where(eq(board.id, boardId))
    .then((r) => r[0]);

  return NextResponse.json({ board: updated });
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await ctx.params;
  const db = getDb();

  // Only owner can delete
  const boardData = await db
    .select()
    .from(board)
    .where(eq(board.id, boardId))
    .then((r) => r[0]);

  if (!boardData)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (boardData.ownerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(board).where(eq(board.id, boardId));

  return NextResponse.json({ ok: true });
}
