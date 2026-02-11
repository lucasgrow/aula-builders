import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, userSettings } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const settings = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return NextResponse.json({ settings });
}

const updateSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    await db
      .update(userSettings)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(userSettings.id, existing.id));
  } else {
    await db.insert(userSettings).values({
      id: `ust_${crypto.randomUUID()}`,
      userId: session.user.id,
      ...parsed.data,
    });
  }

  return NextResponse.json({ ok: true });
}
