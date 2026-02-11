"use client";

import { Avatar, Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { useTheme } from "@/hooks/use-theme";
import { Icon } from "@iconify/react";
import { signOut } from "next-auth/react";

interface Props {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}

export function SettingsClient({ user }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader className="text-lg font-semibold">Profile</CardHeader>
        <CardBody className="flex flex-row items-center gap-4">
          <Avatar src={user.image ?? undefined} name={user.name} size="lg" showFallback />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-small text-default-500">{user.email}</p>
          </div>
        </CardBody>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader className="text-lg font-semibold">Appearance</CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-small text-default-500">
                {theme === "dark" ? "Dark" : "Light"} mode
              </p>
            </div>
            <Button isIconOnly variant="flat" onPress={toggleTheme}>
              <Icon icon={theme === "dark" ? "solar:sun-linear" : "solar:moon-linear"} width={20} />
            </Button>
          </div>
        </CardBody>
      </Card>

      <Divider />

      {/* Sign out */}
      <Button
        color="danger"
        variant="flat"
        startContent={<Icon icon="solar:logout-2-linear" width={18} />}
        onPress={() => signOut({ callbackUrl: "/" })}
      >
        Sign out
      </Button>
    </div>
  );
}
