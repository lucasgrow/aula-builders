import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { users } from "@/server/db";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";
import { env as validatedEnv } from "@/env";

function getEnv(): CloudflareEnv {
  try {
    const { env } = getCloudflareContext();
    return env;
  } catch {
    return {
      AUTH_SECRET: validatedEnv.AUTH_SECRET,
      AUTH_GOOGLE_ID: validatedEnv.AUTH_GOOGLE_ID,
      AUTH_GOOGLE_SECRET: validatedEnv.AUTH_GOOGLE_SECRET,
      AUTH_RESEND_KEY: validatedEnv.AUTH_RESEND_KEY,
      AUTH_EMAIL_FROM: validatedEnv.AUTH_EMAIL_FROM,
    } as CloudflareEnv;
  }
}

export function createAuth(db: any) {
  const env = getEnv();

  return NextAuth({
    trustHost: true,
    secret: env.AUTH_SECRET,
    adapter: {
      ...DrizzleAdapter(db),
      createUser: (data: any) => DrizzleAdapter(db).createUser!({ ...data, createdAt: new Date() }),
    },
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
        maxAge: 60 * 60, // 1 hour
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
