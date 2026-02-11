import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { AuthenticatedLayoutClient } from "./layout-client";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AuthenticatedLayoutClient
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        image: session.user.image ?? null,
      }}
    >
      {children}
    </AuthenticatedLayoutClient>
  );
}
