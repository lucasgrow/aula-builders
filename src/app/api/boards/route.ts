import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, board, boardMember, list, label, users } from "@/server/db";
import { eq, or, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { genId } from "@/lib/id";

const DEFAULT_LABELS = [
  { name: "Bug", color: "#EF4444" },
  { name: "Feature", color: "#8B5CF6" },
  { name: "Enhancement", color: "#3B82F6" },
  { name: "Urgent", color: "#F97316" },
  { name: "Design", color: "#EC4899" },
  { name: "Documentation", color: "#6B7280" },
];

const DEFAULT_LISTS = ["To Do", "In Progress", "Done"];

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const userId = session.user.id!;

  // Boards where user is owner
  const ownedBoards = await db
    .select({
      id: board.id,
      name: board.name,
      description: board.description,
      background: board.background,
      ownerId: board.ownerId,
      isClosed: board.isClosed,
      createdAt: board.createdAt,
    })
    .from(board)
    .where(eq(board.ownerId, userId))
    .orderBy(desc(board.createdAt));

  // Boards where user is a member (not owner)
  const memberBoards = await db
    .select({
      id: board.id,
      name: board.name,
      description: board.description,
      background: board.background,
      ownerId: board.ownerId,
      isClosed: board.isClosed,
      createdAt: board.createdAt,
    })
    .from(board)
    .innerJoin(boardMember, eq(boardMember.boardId, board.id))
    .where(eq(boardMember.userId, userId))
    .orderBy(desc(board.createdAt));

  // Deduplicate (user could be owner AND member)
  const boardMap = new Map<string, (typeof ownedBoards)[0]>();
  for (const b of ownedBoards) boardMap.set(b.id, b);
  for (const b of memberBoards) {
    if (!boardMap.has(b.id)) boardMap.set(b.id, b);
  }

  const allBoards = Array.from(boardMap.values());

  // Get member counts
  const boardIds = allBoards.map((b) => b.id);
  const memberCounts: Record<string, number> = {};

  if (boardIds.length > 0) {
    for (const bid of boardIds) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(boardMember)
        .where(eq(boardMember.boardId, bid))
        .then((r) => r[0]);
      // +1 for owner
      memberCounts[bid] = (countResult?.count ?? 0) + 1;
    }
  }

  const boards = allBoards.map((b) => ({
    ...b,
    memberCount: memberCounts[b.id] ?? 1,
  }));

  return NextResponse.json({ boards });
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  background: z.string().max(50).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  const userId = session.user.id!;
  const boardId = genId("brd");

  // Create board
  await db.insert(board).values({
    id: boardId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    background: parsed.data.background ?? "#059669",
    ownerId: userId,
  });

  // Create default lists
  for (let i = 0; i < DEFAULT_LISTS.length; i++) {
    await db.insert(list).values({
      id: genId("lst"),
      boardId,
      title: DEFAULT_LISTS[i],
      position: i,
    });
  }

  // Create default labels
  for (const lbl of DEFAULT_LABELS) {
    await db.insert(label).values({
      id: genId("lbl"),
      boardId,
      name: lbl.name,
      color: lbl.color,
    });
  }

  // Fetch created board
  const created = await db
    .select()
    .from(board)
    .where(eq(board.id, boardId))
    .then((r) => r[0]);

  return NextResponse.json({ board: created }, { status: 201 });
}
