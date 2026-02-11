import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, board, boardMember, users } from "@/server/db";
import { eq, and } from "drizzle-orm";
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

  // Also include the owner
  const boardData = await db
    .select({ ownerId: board.ownerId })
    .from(board)
    .where(eq(board.id, boardId))
    .then((r) => r[0]);

  let owner = null;
  if (boardData) {
    owner = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, boardData.ownerId))
      .then((r) => r[0]);
  }

  return NextResponse.json({ members, owner });
}

const addSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).optional().default("member"),
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

  // Only owner/admin can add members
  if (access.role !== "owner" && access.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  // Find user by email
  const targetUser = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .then((r) => r[0]);

  if (!targetUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check not already a member
  const existing = await db
    .select()
    .from(boardMember)
    .where(and(eq(boardMember.boardId, boardId), eq(boardMember.userId, targetUser.id)))
    .then((r) => r[0]);

  if (existing)
    return NextResponse.json({ error: "Already a member" }, { status: 409 });

  // Check if target is the owner
  const boardData = await db
    .select({ ownerId: board.ownerId })
    .from(board)
    .where(eq(board.id, boardId))
    .then((r) => r[0]);

  if (boardData?.ownerId === targetUser.id)
    return NextResponse.json({ error: "User is the board owner" }, { status: 409 });

  const id = genId("bmb");

  await db.insert(boardMember).values({
    id,
    boardId,
    userId: targetUser.id,
    role: parsed.data.role,
  });

  const created = await db
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
    .where(eq(boardMember.id, id))
    .then((r) => r[0]);

  return NextResponse.json({ member: created }, { status: 201 });
}

const removeSchema = z.object({
  userId: z.string().min(1),
});

export async function DELETE(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await ctx.params;
  const db = getDb();
  const access = await checkBoardAccess(boardId, session.user.id!, db as any);
  if (!access.allowed)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only owner/admin can remove members
  if (access.role !== "owner" && access.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  // Can't remove the owner
  const boardData = await db
    .select({ ownerId: board.ownerId })
    .from(board)
    .where(eq(board.id, boardId))
    .then((r) => r[0]);

  if (boardData?.ownerId === parsed.data.userId)
    return NextResponse.json({ error: "Cannot remove the board owner" }, { status: 403 });

  await db
    .delete(boardMember)
    .where(and(eq(boardMember.boardId, boardId), eq(boardMember.userId, parsed.data.userId)));

  return NextResponse.json({ ok: true });
}
