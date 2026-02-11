import { getCloudflareContext } from "@opennextjs/cloudflare";
import { env as validatedEnv } from "@/env";

export function getR2(): R2Bucket {
  const { env } = getCloudflareContext();
  const bucket = env.STORAGE;
  if (!bucket) throw new Error("STORAGE (R2) binding not available");
  return bucket;
}

interface PresignOptions {
  filename: string;
  contentType: string;
  prefix?: string;
  expiresIn?: number;
}

interface PresignResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export async function generatePresignedUploadUrl(
  opts: PresignOptions
): Promise<PresignResult> {
  const { AwsClient } = await import("aws4fetch");

  let cfEnv: Partial<CloudflareEnv> | null = null;
  try {
    cfEnv = getCloudflareContext().env as Partial<CloudflareEnv>;
  } catch {
    // local dev fallback
  }

  const accountId = cfEnv?.R2_ACCOUNT_ID ?? validatedEnv.R2_ACCOUNT_ID;
  const accessKeyId = cfEnv?.R2_ACCESS_KEY_ID ?? validatedEnv.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    cfEnv?.R2_SECRET_ACCESS_KEY ?? validatedEnv.R2_SECRET_ACCESS_KEY;
  const bucketName = cfEnv?.R2_BUCKET_NAME ?? validatedEnv.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .dev.vars. See CLAUDE.md § Onboarding Guide step 7."
    );
  }

  const client = new AwsClient({ accessKeyId, secretAccessKey });
  const expiresIn = opts.expiresIn ?? 600;
  const key = `${opts.prefix ? opts.prefix + "/" : ""}${Date.now()}-${opts.filename}`;

  const url = new URL(
    `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`
  );
  url.searchParams.set("X-Amz-Expires", String(expiresIn));

  const signed = await client.sign(
    new Request(url.toString(), {
      method: "PUT",
      headers: { "Content-Type": opts.contentType },
    }),
    { aws: { signQuery: true } }
  );

  return {
    uploadUrl: signed.url,
    key,
    expiresIn,
  };
}
