import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  getDb,
  card,
  cardLabel,
  cardMember,
  label,
  users,
  checklist,
  checklistItem,
  comment,
  attachment,
} from "@/server/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { z } from "zod";
import { checkBoardAccess } from "@/lib/board-access";

type RouteCtx = { params: Promise<{ boardId: string; cardId: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, cardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Card data
  const cardData = await db
    .select()
    .from(card)
    .where(eq(card.id, cardId))
    .then((r) => r[0]);

  if (!cardData)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Labels
  const labels = await db
    .select({
      id: label.id,
      name: label.name,
      color: label.color,
    })
    .from(cardLabel)
    .innerJoin(label, eq(cardLabel.labelId, label.id))
    .where(eq(cardLabel.cardId, cardId));

  // Members with user info
  const members = await db
    .select({
      id: cardMember.id,
      userId: cardMember.userId,
      createdAt: cardMember.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(cardMember)
    .innerJoin(users, eq(cardMember.userId, users.id))
    .where(eq(cardMember.cardId, cardId));

  // Checklists with items
  const checklists = await db
    .select()
    .from(checklist)
    .where(eq(checklist.cardId, cardId))
    .orderBy(asc(checklist.position));

  const checklistsWithItems = [];
  for (const cl of checklists) {
    const items = await db
      .select()
      .from(checklistItem)
      .where(eq(checklistItem.checklistId, cl.id))
      .orderBy(asc(checklistItem.position));

    checklistsWithItems.push({ ...cl, items });
  }

  // Comments with user info
  const comments = await db
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
    .where(eq(comment.cardId, cardId))
    .orderBy(desc(comment.createdAt));

  // Attachments
  const attachments = await db
    .select()
    .from(attachment)
    .where(eq(attachment.cardId, cardId))
    .orderBy(desc(attachment.createdAt));

  return NextResponse.json({
    card: cardData,
    labels,
    members,
    checklists: checklistsWithItems,
    comments,
    attachments,
  });
}

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  listId: z.string().optional(),
  position: z.number().int().min(0).optional(),
  dueDate: z.string().nullable().optional(),
  coverColor: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, cardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const updates: Record<string, any> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.listId !== undefined) updates.listId = parsed.data.listId;
  if (parsed.data.position !== undefined) updates.position = parsed.data.position;
  if (parsed.data.dueDate !== undefined) {
    updates.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  }
  if (parsed.data.coverColor !== undefined) updates.coverColor = parsed.data.coverColor;
  if (parsed.data.isArchived !== undefined) updates.isArchived = parsed.data.isArchived;

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  await db.update(card).set(updates).where(eq(card.id, cardId));

  const updated = await db
    .select()
    .from(card)
    .where(eq(card.id, cardId))
    .then((r) => r[0]);

  return NextResponse.json({ card: updated });
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

  const existing = await db
    .select()
    .from(card)
    .where(eq(card.id, cardId))
    .then((r) => r[0]);

  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(card).where(eq(card.id, cardId));

  return NextResponse.json({ ok: true });
}
