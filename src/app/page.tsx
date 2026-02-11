import { Button } from "@heroui/react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const features = [
  {
    icon: "solar:shield-check-linear",
    title: "Auth Ready",
    desc: "Google OAuth + magic link out of the box.",
  },
  {
    icon: "solar:server-square-linear",
    title: "Edge Native",
    desc: "D1, R2, Workers — all on Cloudflare.",
  },
  {
    icon: "solar:palette-round-linear",
    title: "Themeable",
    desc: "HeroUI + dark mode + color palettes.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Navbar */}
      <nav className="flex h-16 items-center justify-between border-b border-divider px-6">
        <span className="text-lg font-bold">Builder</span>
        <Button as={Link} href="/login" variant="flat" size="sm">
          Sign in
        </Button>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
          Ship your SaaS on Cloudflare
        </h1>
        <p className="max-w-lg text-lg text-default-500">
          Auth, database, storage, and deploy — all wired up.
          Clone, run setup, and start building.
        </p>
        <div className="flex gap-3">
          <Button as={Link} href="/login" color="primary" size="lg">
            Get Started
          </Button>
          <Button
            as="a"
            href="https://github.com"
            target="_blank"
            rel="noopener,noreferrer"
            variant="bordered"
            size="lg"
            startContent={<Icon icon="mdi:github" width={20} />}
          >
            GitHub
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-divider bg-content1 p-6">
            <Icon icon={f.icon} width={32} className="mb-3 text-primary" />
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-1 text-small text-default-500">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-divider px-6 py-6 text-center text-small text-default-400">
        Built with Cloudflare Builder
      </footer>
    </div>
  );
}
