import { getDb } from "./db";
import { createAuth } from "./auth/base";

function getInstance() {
  return createAuth(getDb());
}

export function GET(req: any) {
  return getInstance().handlers.GET(req);
}

export function POST(req: any) {
  return getInstance().handlers.POST(req);
}

export function auth(...args: any[]) {
  return (getInstance().auth as (...a: any[]) => any)(...args);
}

export function signIn(...args: any[]) {
  return (getInstance().signIn as (...a: any[]) => any)(...args);
}

export function signOut(...args: any[]) {
  return (getInstance().signOut as (...a: any[]) => any)(...args);
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
