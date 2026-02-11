import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Coerce empty strings (from .dev.vars) to undefined so `.optional()` works
const optionalEnv = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().min(1).optional(),
);

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    AUTH_RESEND_KEY: z.string().min(1),
    AUTH_EMAIL_FROM: z.string().min(1),
    R2_ACCESS_KEY_ID: optionalEnv,
    R2_SECRET_ACCESS_KEY: optionalEnv,
    R2_ACCOUNT_ID: optionalEnv,
    R2_BUCKET_NAME: optionalEnv,
  },
  experimental__runtimeEnv: process.env,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
});
