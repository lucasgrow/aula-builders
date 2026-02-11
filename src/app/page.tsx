import { Button } from "@heroui/react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const features = [
  {
    icon: "solar:widget-5-linear",
    title: "Boards",
    desc: "Organize projects into boards with lists and cards. See everything at a glance.",
  },
  {
    icon: "solar:list-check-linear",
    title: "Lists & Cards",
    desc: "Break work into actionable steps. Drag and drop to prioritize what matters.",
  },
  {
    icon: "solar:users-group-rounded-linear",
    title: "Collaboration",
    desc: "Assign members, add comments, set due dates. Keep your team in sync.",
  },
];

const powerFeatures = [
  {
    icon: "solar:tag-linear",
    title: "Labels & Filters",
    desc: "Color-coded labels to categorize cards. Filter to find exactly what you need.",
  },
  {
    icon: "solar:checklist-minimalistic-linear",
    title: "Checklists",
    desc: "Break cards into subtasks with checklists. Track progress with completion bars.",
  },
  {
    icon: "solar:calendar-linear",
    title: "Due Dates",
    desc: "Never miss a deadline. Visual indicators show what's upcoming, due, or overdue.",
  },
];

const stats = [
  { value: "10x", label: "Faster project setup" },
  { value: "75%", label: "Less time in meetings" },
  { value: "100%", label: "Open & self-hosted" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-divider bg-background/80 backdrop-blur-md px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Icon icon="solar:widget-5-bold" width={18} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Bello</span>
        </div>
        <div className="flex items-center gap-3">
          <Button as={Link} href="/login" variant="light" size="sm">
            Log in
          </Button>
          <Button as={Link} href="/login" color="primary" size="sm">
            Get Bello for free
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-primary-100/50 to-background dark:from-primary-50/20 dark:via-background dark:to-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-32">
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
            Organize anything,{" "}
            <span className="text-primary">together</span>
          </h1>
          <p className="max-w-xl text-lg text-default-600">
            Bello brings all your tasks, teammates, and tools together. Keep
            everything in the same place — even if your team isn&apos;t.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button as={Link} href="/login" color="primary" size="lg" className="px-8 font-semibold">
              Get started — it&apos;s free
            </Button>
          </div>

          {/* Board mock illustration */}
          <div className="mt-4 w-full max-w-4xl rounded-2xl border border-divider bg-content1 p-4 shadow-apple-xl sm:p-6">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {["To Do", "In Progress", "Done"].map((col, ci) => (
                <div key={col} className="flex w-60 flex-shrink-0 flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${ci === 0 ? "bg-default-400" : ci === 1 ? "bg-warning" : "bg-success"}`} />
                    <span className="text-small font-semibold">{col}</span>
                    <span className="ml-auto text-tiny text-default-400">{ci === 0 ? 3 : ci === 1 ? 2 : 1}</span>
                  </div>
                  {[...Array(ci === 0 ? 3 : ci === 1 ? 2 : 1)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-divider bg-content2 p-3 shadow-sm"
                    >
                      <div className="flex gap-1.5 mb-2">
                        {i === 0 && <div className="h-1.5 w-8 rounded-full bg-primary/60" />}
                        {i <= 1 && <div className="h-1.5 w-8 rounded-full bg-warning/60" />}
                      </div>
                      <div className="h-3 w-3/4 rounded bg-default-200" />
                      <div className="mt-2 h-2 w-1/2 rounded bg-default-100" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bello 101 */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Bello 101</p>
          <h2 className="text-3xl font-bold sm:text-4xl">Your productivity powerhouse</h2>
          <p className="mt-3 text-default-500 max-w-xl mx-auto">
            Simple, flexible, and powerful. All you need to build workflows for any project.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-divider bg-content1 p-6 transition-shadow hover:shadow-apple-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-50/20">
                <Icon icon={f.icon} width={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-small text-default-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Power features */}
      <section className="bg-content2 dark:bg-content1">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Do more with Bello</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Built for how teams actually work</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {powerFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-divider bg-background p-6 transition-shadow hover:shadow-apple-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-50/20">
                  <Icon icon={f.icon} width={28} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-small text-default-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-primary">{s.value}</div>
              <p className="mt-1 text-default-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-800">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Get started today
          </h2>
          <p className="mt-3 text-primary-200">
            Join teams that use Bello to get more done.
          </p>
          <Button
            as={Link}
            href="/login"
            size="lg"
            className="mt-8 bg-white text-primary-700 font-semibold px-8 hover:bg-primary-50"
          >
            Sign up — it&apos;s free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-divider px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Icon icon="solar:widget-5-bold" width={14} className="text-primary-foreground" />
            </div>
            <span className="font-semibold">Bello</span>
          </div>
          <p className="text-small text-default-400">
            Built on Cloudflare. Open source.
          </p>
        </div>
      </footer>
    </div>
  );
}
