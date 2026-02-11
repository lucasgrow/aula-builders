import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { generatePresignedUploadUrl } from "@/lib/r2";
import { z } from "zod";

const schema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  prefix: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await generatePresignedUploadUrl(parsed.data);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
