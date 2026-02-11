import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { users, accounts, sessions, verificationTokens } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";
import type { Adapter } from "next-auth/adapters";

function getEnv(): CloudflareEnv {
  try {
    const { env } = getCloudflareContext();
    return env;
  } catch {
    // Dev fallback: read from process.env directly (no Zod validation to avoid crash in Workers)
    return {
      AUTH_SECRET: process.env.AUTH_SECRET ?? "",
      AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ?? "",
      AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ?? "",
      AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY ?? "",
      AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM ?? "",
    } as CloudflareEnv;
  }
}

function createD1Adapter(db: any): Adapter {
  return {
    async createUser(data: any) {
      const id = crypto.randomUUID();
      await db.insert(users).values({
        id,
        name: data.name ?? null,
        email: data.email,
        emailVerified: data.emailVerified ?? null,
        image: data.image ?? null,
        createdAt: new Date(),
      });
      const user = await db.select().from(users).where(eq(users.id, id)).then((r: any[]) => r[0]);
      return user;
    },
    async getUser(id: string) {
      return await db.select().from(users).where(eq(users.id, id)).then((r: any[]) => r[0] ?? null);
    },
    async getUserByEmail(email: string) {
      return await db.select().from(users).where(eq(users.email, email)).then((r: any[]) => r[0] ?? null);
    },
    async getUserByAccount({ provider, providerAccountId }: any) {
      const account = await db.select().from(accounts)
        .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
        .then((r: any[]) => r[0]);
      if (!account) return null;
      return await db.select().from(users).where(eq(users.id, account.userId)).then((r: any[]) => r[0] ?? null);
    },
    async updateUser(data: any) {
      const { id, ...rest } = data;
      await db.update(users).set(rest).where(eq(users.id, id));
      return await db.select().from(users).where(eq(users.id, id)).then((r: any[]) => r[0]);
    },
    async deleteUser(id: string) {
      await db.delete(users).where(eq(users.id, id));
    },
    async linkAccount(data: any) {
      await db.insert(accounts).values(data);
    },
    async unlinkAccount({ provider, providerAccountId }: any) {
      await db.delete(accounts).where(
        and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId))
      );
    },
    async createSession(data: any) {
      await db.insert(sessions).values(data);
      return await db.select().from(sessions).where(eq(sessions.sessionToken, data.sessionToken)).then((r: any[]) => r[0]);
    },
    async getSessionAndUser(sessionToken: string) {
      const session = await db.select().from(sessions).where(eq(sessions.sessionToken, sessionToken)).then((r: any[]) => r[0]);
      if (!session) return null;
      const user = await db.select().from(users).where(eq(users.id, session.userId)).then((r: any[]) => r[0]);
      if (!user) return null;
      return { session, user };
    },
    async updateSession(data: any) {
      await db.update(sessions).set(data).where(eq(sessions.sessionToken, data.sessionToken));
      return await db.select().from(sessions).where(eq(sessions.sessionToken, data.sessionToken)).then((r: any[]) => r[0] ?? null);
    },
    async deleteSession(sessionToken: string) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },
    async createVerificationToken(data: any) {
      await db.insert(verificationTokens).values(data);
      return data;
    },
    async useVerificationToken({ identifier, token }: any) {
      const vt = await db.select().from(verificationTokens)
        .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token)))
        .then((r: any[]) => r[0] ?? null);
      if (vt) {
        await db.delete(verificationTokens).where(
          and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token))
        );
      }
      return vt;
    },
  };
}

export function createAuth(db: any) {
  const env = getEnv();

  return NextAuth({
    trustHost: true,
    secret: env.AUTH_SECRET,
    adapter: createD1Adapter(db),
    session: {
      strategy: "jwt",
    },
    providers: [
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
      {
        id: "resend",
        name: "Email",
        type: "email",
        maxAge: 60 * 60,
        sendVerificationRequest: async ({ identifier: email, url }) => {
          const resend = new Resend(env.AUTH_RESEND_KEY);
          await resend.emails.send({
            from: env.AUTH_EMAIL_FROM || "noreply@yourdomain.com",
            to: email,
            subject: "Sign in link",
            html: `<p>Click <a href="${url}">here</a> to sign in.</p>`,
          });
        },
      },
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
        }
        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
          session.user.image = token.picture as string;

          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.id, token.id as string))
            .limit(1)
            .then((rows: any[]) => rows[0]);

          if (dbUser) {
            session.user.role = dbUser.role || "user";
          }
        }
        return session;
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  });
}
