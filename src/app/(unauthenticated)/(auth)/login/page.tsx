"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Divider, Input } from "@heroui/react";
import { signIn } from "next-auth/react";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await signIn("resend", { email, callbackUrl: "/dashboard" });
    setSent(true);
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-col items-center gap-1 pb-0">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="text-small text-default-500">Welcome back</p>
      </CardHeader>
      <CardBody className="gap-4">
        <Button
          variant="bordered"
          className="w-full"
          startContent={<Icon icon="flat-color-icons:google" width={20} />}
          onPress={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <Divider className="flex-1" />
          <span className="text-tiny text-default-400">or</span>
          <Divider className="flex-1" />
        </div>

        {sent ? (
          <p className="text-center text-small text-success">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onValueChange={setEmail}
              isRequired
            />
            <Button type="submit" color="primary" isLoading={loading} className="w-full">
              Send magic link
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
