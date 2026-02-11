"use client";

import React, { useState } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Breadcrumbs,
  BreadcrumbItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import Sidebar, { type SidebarItem } from "@/components/layout/sidebar";
import { useTheme } from "@/hooks/use-theme";

const sidebarItems: SidebarItem[] = [
  { key: "dashboard", href: "/dashboard", icon: "solar:home-2-linear", title: "Dashboard" },
  { key: "boards", href: "/boards", icon: "solar:widget-5-linear", title: "Boards" },
  { key: "settings", href: "/settings", icon: "solar:settings-linear", title: "Settings" },
];

const mobileNavItems = [
  { key: "dashboard", href: "/dashboard", icon: "solar:home-2-bold", title: "Dashboard" },
  { key: "boards", href: "/boards", icon: "solar:widget-5-bold", title: "Boards" },
  { key: "settings", href: "/settings", icon: "solar:settings-bold", title: "Settings" },
];

interface LayoutUser {
  name: string;
  email: string;
  image: string | null;
}

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  boards: "Boards",
  settings: "Settings",
};

function generateBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((slug, i) => ({
    label: breadcrumbLabels[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));
}

export function AuthenticatedLayoutClient({
  user,
  children,
}: {
  user: LayoutUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const breadcrumbs = generateBreadcrumbs(pathname);
  const currentCrumb = breadcrumbs[breadcrumbs.length - 1] ?? null;
  const backCrumb = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  return (
    <div className="flex min-h-dvh">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-divider bg-content1 shadow-apple-md transition-all duration-200 sticky top-0 h-dvh",
          isCompact ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-divider px-4", isCompact && "justify-center")}>
          {!isCompact && <span className="text-lg font-bold">Bello</span>}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setIsCompact(!isCompact)}
            className={cn(!isCompact && "ml-auto")}
          >
            <Icon icon={isCompact ? "solar:sidebar-minimalistic-linear" : "solar:sidebar-minimalistic-bold"} width={20} />
          </Button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Sidebar items={sidebarItems} isCompact={isCompact} defaultSelectedKey="dashboard" />
        </div>

        {/* User */}
        <div className="border-t border-divider p-3">
          <Dropdown placement="top-start">
            <DropdownTrigger>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-large p-2 hover:bg-default-100 transition-colors",
                  isCompact && "justify-center"
                )}
              >
                <Avatar src={user.image ?? undefined} name={user.name} size="sm" showFallback />
                {!isCompact && (
                  <div className="flex-1 text-left">
                    <p className="text-small font-medium truncate">{user.name}</p>
                    <p className="text-tiny text-default-400 truncate">{user.email}</p>
                  </div>
                )}
                {!isCompact && <Icon icon="solar:alt-arrow-up-linear" width={16} className="text-default-400" />}
              </button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="settings" href="/settings" startContent={<Icon icon="solar:settings-linear" width={18} />}>
                Settings
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<Icon icon="solar:logout-2-linear" width={18} />}
                onPress={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-divider bg-background/80 backdrop-blur-md shadow-apple-md px-4 md:px-6">
          <div className="min-w-0 flex-1">
            {/* Mobile */}
            <div className="flex items-center gap-1.5 min-w-0 sm:hidden">
              {backCrumb && (
                <Button as={Link} href={backCrumb.href} isIconOnly variant="light" size="sm" aria-label="Back">
                  <Icon icon="solar:arrow-left-linear" width={20} />
                </Button>
              )}
              <span className="text-small font-semibold truncate">{currentCrumb?.label ?? ""}</span>
            </div>
            {/* Desktop */}
            <div className="hidden sm:block">
              <Breadcrumbs size="sm" classNames={{ list: "md:text-medium" }}>
                {breadcrumbs.map((crumb, i) => (
                  <BreadcrumbItem key={crumb.href} href={i < breadcrumbs.length - 1 ? crumb.href : undefined}>
                    {crumb.label}
                  </BreadcrumbItem>
                ))}
              </Breadcrumbs>
            </div>
          </div>

          <Button isIconOnly variant="light" size="sm" onPress={toggleTheme} aria-label="Toggle theme">
            <Icon icon={theme === "dark" ? "solar:sun-linear" : "solar:moon-linear"} width={20} />
          </Button>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-4 py-6 md:px-6">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
        <nav className="w-[95%] max-w-md rounded-full border border-divider bg-content1/80 backdrop-blur-md shadow-apple-xl">
          <div className="flex h-16 items-center justify-around px-4">
            {mobileNavItems.map((item) => {
              const active =
                item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors min-w-[44px] min-h-[44px]",
                    active ? "text-primary" : "text-default-500 hover:text-default-700"
                  )}
                >
                  <Icon icon={item.icon} width={24} className={cn(active && "scale-110")} />
                  <span className="text-tiny font-medium">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
