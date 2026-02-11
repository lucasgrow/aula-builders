import { eq, and, or } from "drizzle-orm";
import { board, boardMember } from "@/server/db/schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "@/server/db/schema";

type Db = DrizzleD1Database<typeof schema>;

export type BoardRole = "admin" | "member" | "viewer";

export async function checkBoardAccess(
  boardId: string,
  userId: string,
  db: Db,
  requiredRole?: BoardRole[]
): Promise<{ allowed: boolean; role: BoardRole | "owner" }> {
  const b = await db
    .select({ ownerId: board.ownerId })
    .from(board)
    .where(and(eq(board.id, boardId), eq(board.isClosed, false)))
    .limit(1)
    .then((r) => r[0]);

  if (!b) return { allowed: false, role: "viewer" };

  if (b.ownerId === userId) return { allowed: true, role: "owner" };

  const membership = await db
    .select({ role: boardMember.role })
    .from(boardMember)
    .where(and(eq(boardMember.boardId, boardId), eq(boardMember.userId, userId)))
    .limit(1)
    .then((r) => r[0]);

  if (!membership) return { allowed: false, role: "viewer" };

  const role = membership.role as BoardRole;
  if (requiredRole && !requiredRole.includes(role)) {
    return { allowed: false, role };
  }

  return { allowed: true, role };
}
