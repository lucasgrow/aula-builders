import { sqliteTable, text, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── NextAuth tables ──────────────────────────────────────────────

export const users = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ── App tables ───────────────────────────────────────────────────

export const userSettings = sqliteTable("user_settings", {
  id: text("id").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme", { enum: ["light", "dark", "system"] }).default("system"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ── Bello (Kanban) tables ────────────────────────────────────────

export const board = sqliteTable("board", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  background: text("background").default("#059669"),
  ownerId: text("ownerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isClosed: integer("isClosed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const boardMember = sqliteTable(
  "board_member",
  {
    id: text("id").notNull().primaryKey(),
    boardId: text("boardId")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "member", "viewer"] })
      .notNull()
      .default("member"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uniqMember: uniqueIndex("board_member_uniq").on(t.boardId, t.userId),
  })
);

export const list = sqliteTable("list", {
  id: text("id").notNull().primaryKey(),
  boardId: text("boardId")
    .notNull()
    .references(() => board.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  isArchived: integer("isArchived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const card = sqliteTable("card", {
  id: text("id").notNull().primaryKey(),
  listId: text("listId")
    .notNull()
    .references(() => list.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  dueDate: integer("dueDate", { mode: "timestamp" }),
  coverColor: text("coverColor"),
  isArchived: integer("isArchived", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const label = sqliteTable("label", {
  id: text("id").notNull().primaryKey(),
  boardId: text("boardId")
    .notNull()
    .references(() => board.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const cardLabel = sqliteTable(
  "card_label",
  {
    id: text("id").notNull().primaryKey(),
    cardId: text("cardId")
      .notNull()
      .references(() => card.id, { onDelete: "cascade" }),
    labelId: text("labelId")
      .notNull()
      .references(() => label.id, { onDelete: "cascade" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uniqCardLabel: uniqueIndex("card_label_uniq").on(t.cardId, t.labelId),
  })
);

export const cardMember = sqliteTable(
  "card_member",
  {
    id: text("id").notNull().primaryKey(),
    cardId: text("cardId")
      .notNull()
      .references(() => card.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uniqCardMember: uniqueIndex("card_member_uniq").on(t.cardId, t.userId),
  })
);

export const comment = sqliteTable("comment", {
  id: text("id").notNull().primaryKey(),
  cardId: text("cardId")
    .notNull()
    .references(() => card.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const activity = sqliteTable("activity", {
  id: text("id").notNull().primaryKey(),
  boardId: text("boardId")
    .notNull()
    .references(() => board.id, { onDelete: "cascade" }),
  cardId: text("cardId"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  data: text("data"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const checklist = sqliteTable("checklist", {
  id: text("id").notNull().primaryKey(),
  cardId: text("cardId")
    .notNull()
    .references(() => card.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const checklistItem = sqliteTable("checklist_item", {
  id: text("id").notNull().primaryKey(),
  checklistId: text("checklistId")
    .notNull()
    .references(() => checklist.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isChecked: integer("isChecked", { mode: "boolean" }).notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const attachment = sqliteTable("attachment", {
  id: text("id").notNull().primaryKey(),
  cardId: text("cardId")
    .notNull()
    .references(() => card.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalFilename: text("originalFilename").notNull(),
  contentType: text("contentType").notNull(),
  size: integer("size").notNull(),
  s3Key: text("s3Key").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
