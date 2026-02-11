"use client";

import { HeroUIProvider } from "@heroui/react";
import { Agentation } from "agentation";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>
      {process.env.NODE_ENV === "development" && <Agentation />}
    </SessionProvider>
  );
}
