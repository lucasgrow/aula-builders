import type { Metadata } from "next";
import { inter } from "./fonts";
import { Providers } from "@/components/providers/providers";
import { ThemeScript } from "@/lib/theme/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloudflare Builder",
  description: "SaaS starter on Cloudflare",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.variable + " font-sans"}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
