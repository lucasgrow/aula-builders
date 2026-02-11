interface CloudflareEnv {
  DATABASE: D1Database;
  STORAGE: R2Bucket;
  AUTH_SECRET: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
  AUTH_RESEND_KEY: string;
  AUTH_EMAIL_FROM: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_ACCOUNT_ID?: string;
  R2_BUCKET_NAME?: string;
}
