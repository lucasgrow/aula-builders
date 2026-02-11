import { auth } from "@/server/auth";
import { Card, CardBody } from "@heroui/react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Card>
        <CardBody>
          <p className="text-default-500">
            Welcome, <span className="font-medium text-foreground">{session?.user?.name ?? "User"}</span>.
            Start building your app here.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
