import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import crypto from "node:crypto";

const root = resolve(__dirname, "..");

function run(cmd: string, opts?: { cwd?: string }): string {
  return execSync(cmd, {
    encoding: "utf-8",
    cwd: opts?.cwd ?? root,
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function runSafe(cmd: string): string | null {
  try {
    return run(cmd);
  } catch {
    return null;
  }
}

// ── Palettes ────────────────────────────────────────────────────

type Palette = {
  label: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};

const palettes: Record<string, Palette> = {
  zinc: {
    label: "Black & White (zinc)",
    light: {
      50: "#FAFAFA", 100: "#F4F4F5", 200: "#E4E4E7", 300: "#D4D4D8",
      400: "#A1A1AA", 500: "#71717A", 600: "#52525B", 700: "#3F3F46",
      800: "#27272A", 900: "#18181B", DEFAULT: "#18181B", foreground: "#FAFAFA",
    },
    dark: {
      50: "#18181B", 100: "#27272A", 200: "#3F3F46", 300: "#52525B",
      400: "#71717A", 500: "#A1A1AA", 600: "#D4D4D8", 700: "#E4E4E7",
      800: "#F4F4F5", 900: "#FAFAFA", DEFAULT: "#FAFAFA", foreground: "#18181B",
    },
  },
  emerald: {
    label: "Green (emerald)",
    light: {
      50: "#ECFDF5", 100: "#D1FAE5", 200: "#A7F3D0", 300: "#6EE7B7",
      400: "#34D399", 500: "#10B981", 600: "#059669", 700: "#047857",
      800: "#065F46", 900: "#064E3B", DEFAULT: "#059669", foreground: "#FFFFFF",
    },
    dark: {
      50: "#064E3B", 100: "#065F46", 200: "#047857", 300: "#059669",
      400: "#10B981", 500: "#34D399", 600: "#6EE7B7", 700: "#A7F3D0",
      800: "#D1FAE5", 900: "#ECFDF5", DEFAULT: "#34D399", foreground: "#064E3B",
    },
  },
  orange: {
    label: "Orange",
    light: {
      50: "#FFF7ED", 100: "#FFEDD5", 200: "#FED7AA", 300: "#FDBA74",
      400: "#FB923C", 500: "#F97316", 600: "#EA580C", 700: "#C2410C",
      800: "#9A3412", 900: "#7C2D12", DEFAULT: "#EA580C", foreground: "#FFFFFF",
    },
    dark: {
      50: "#7C2D12", 100: "#9A3412", 200: "#C2410C", 300: "#EA580C",
      400: "#F97316", 500: "#FB923C", 600: "#FDBA74", 700: "#FED7AA",
      800: "#FFEDD5", 900: "#FFF7ED", DEFAULT: "#FB923C", foreground: "#7C2D12",
    },
  },
  violet: {
    label: "Purple (violet)",
    light: {
      50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD",
      400: "#A78BFA", 500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9",
      800: "#5B21B6", 900: "#4C1D95", DEFAULT: "#7C3AED", foreground: "#FFFFFF",
    },
    dark: {
      50: "#4C1D95", 100: "#5B21B6", 200: "#6D28D9", 300: "#7C3AED",
      400: "#8B5CF6", 500: "#A78BFA", 600: "#C4B5FD", 700: "#DDD6FE",
      800: "#EDE9FE", 900: "#F5F3FF", DEFAULT: "#A78BFA", foreground: "#4C1D95",
    },
  },
  amber: {
    label: "Yellow (amber)",
    light: {
      50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D",
      400: "#FBBF24", 500: "#F59E0B", 600: "#D97706", 700: "#B45309",
      800: "#92400E", 900: "#78350F", DEFAULT: "#D97706", foreground: "#FFFFFF",
    },
    dark: {
      50: "#78350F", 100: "#92400E", 200: "#B45309", 300: "#D97706",
      400: "#F59E0B", 500: "#FBBF24", 600: "#FCD34D", 700: "#FDE68A",
      800: "#FEF3C7", 900: "#FFFBEB", DEFAULT: "#FBBF24", foreground: "#78350F",
    },
  },
};

function generateTailwindPrimary(paletteKey: string): string {
  const pal = palettes[paletteKey];
  const indent = "              ";
  const lines = (obj: Record<string, string>) =>
    Object.entries(obj)
      .map(([k, v]) => `${indent}${k}: "${v}",`)
      .join("\n");

  return `// Primary colors for "${paletteKey}" palette
            primary: {
${lines(pal.light)}
            },`;
}

function patchTailwindConfig(paletteKey: string) {
  const file = resolve(root, "tailwind.config.ts");
  let content = readFileSync(file, "utf-8");

  // Update PALETTE const
  content = content.replace(
    /const PALETTE = "[^"]+"/,
    `const PALETTE = "${paletteKey}"`
  );

  if (paletteKey === "zinc") {
    writeFileSync(file, content);
    return;
  }

  const pal = palettes[paletteKey];

  // Replace light primary block
  const lightPrimaryRegex =
    /(themes:\s*\{\s*light:\s*\{\s*colors:\s*\{[\s\S]*?)primary:\s*\{[^}]+\}/;
  const lightPrimary = Object.entries(pal.light)
    .map(([k, v]) => `              ${k}: "${v}",`)
    .join("\n");
  content = content.replace(
    lightPrimaryRegex,
    `$1primary: {\n${lightPrimary}\n            }`
  );

  // Replace dark primary block
  const darkSection = content.indexOf("dark: {");
  if (darkSection !== -1) {
    const after = content.slice(darkSection);
    const darkPrimaryRegex = /(colors:\s*\{[\s\S]*?)primary:\s*\{[^}]+\}/;
    const darkPrimary = Object.entries(pal.dark)
      .map(([k, v]) => `              ${k}: "${v}",`)
      .join("\n");
    const patched = after.replace(
      darkPrimaryRegex,
      `$1primary: {\n${darkPrimary}\n            }`
    );
    content = content.slice(0, darkSection) + patched;
  }

  writeFileSync(file, content);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  p.intro("cloudflare-builder setup");

  // 1. Check wrangler
  const whoami = runSafe("npx wrangler whoami");
  if (!whoami || whoami.includes("Not logged in")) {
    p.log.warning("Not logged into Wrangler. Running `wrangler login`...");
    execSync("npx wrangler login", { stdio: "inherit", cwd: root });
  } else {
    p.log.success(`Wrangler: ${whoami.split("\n").pop()}`);
  }

  // 2. Project name
  const projectName = (await p.text({
    message: "Project name (used for D1, R2, worker):",
    placeholder: "my-saas",
    validate: (v) =>
      /^[a-z0-9-]+$/.test(v) ? undefined : "Lowercase letters, numbers, hyphens only",
  })) as string;

  if (p.isCancel(projectName)) process.exit(0);

  // 3. Create D1
  p.log.step(`Creating D1 database: ${projectName}-d1`);
  const d1Output = run(`npx wrangler d1 create ${projectName}-d1`);
  const dbIdMatch = d1Output.match(/database_id\s*=\s*"([^"]+)"/);
  if (!dbIdMatch) {
    p.log.error("Could not extract database_id from wrangler output:");
    p.log.message(d1Output);
    process.exit(1);
  }
  const databaseId = dbIdMatch[1];
  p.log.success(`D1 created: ${databaseId}`);

  // 4. Create R2
  p.log.step(`Creating R2 bucket: ${projectName}-storage`);
  try {
    run(`npx wrangler r2 bucket create ${projectName}-storage`);
    p.log.success("R2 bucket created");
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      p.log.warning("R2 bucket already exists, continuing...");
    } else {
      throw e;
    }
  }

  // 5. Palette
  const palette = (await p.select({
    message: "Color palette:",
    options: Object.entries(palettes).map(([key, pal]) => ({
      value: key,
      label: pal.label,
    })),
  })) as string;

  if (p.isCancel(palette)) process.exit(0);

  // 6. Google OAuth
  p.log.message(
    "Set up Google OAuth: https://console.cloud.google.com/apis/credentials"
  );
  p.log.message(
    `Redirect URI: http://localhost:3000/api/auth/callback/google`
  );
  const googleId = (await p.text({
    message: "Google OAuth Client ID:",
    placeholder: "xxxx.apps.googleusercontent.com",
  })) as string;
  if (p.isCancel(googleId)) process.exit(0);

  const googleSecret = (await p.text({
    message: "Google OAuth Client Secret:",
  })) as string;
  if (p.isCancel(googleSecret)) process.exit(0);

  // 7. Resend
  p.log.message("Get a Resend API key: https://resend.com/api-keys");
  p.log.message(
    "Note: Free tier only sends to your account email. Add a domain for other recipients."
  );
  const resendKey = (await p.text({
    message: "Resend API key:",
    placeholder: "re_xxxx",
  })) as string;
  if (p.isCancel(resendKey)) process.exit(0);

  const emailFrom = (await p.text({
    message: "Email sender address:",
    placeholder: "noreply@yourdomain.com",
  })) as string;
  if (p.isCancel(emailFrom)) process.exit(0);

  // 8. Auth secret
  const authSecret = crypto.randomUUID();

  // 9. Write .dev.vars
  const devVars = [
    `AUTH_SECRET=${authSecret}`,
    `AUTH_GOOGLE_ID=${googleId}`,
    `AUTH_GOOGLE_SECRET=${googleSecret}`,
    `AUTH_RESEND_KEY=${resendKey}`,
    `AUTH_EMAIL_FROM=${emailFrom}`,
    `R2_ACCESS_KEY_ID=`,
    `R2_SECRET_ACCESS_KEY=`,
    `R2_ACCOUNT_ID=`,
    `R2_BUCKET_NAME=${projectName}-storage`,
  ].join("\n");

  writeFileSync(resolve(root, ".dev.vars"), devVars + "\n");
  p.log.success(".dev.vars created");

  // 10. Update wrangler.toml
  const tomlPath = resolve(root, "wrangler.toml");
  let toml = readFileSync(tomlPath, "utf-8");
  toml = toml.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
  toml = toml.replace(/\{\{D1_DATABASE_ID\}\}/g, databaseId);
  writeFileSync(tomlPath, toml);
  p.log.success("wrangler.toml updated");

  // 11. Patch tailwind palette
  patchTailwindConfig(palette);
  p.log.success(`Tailwind palette set to "${palette}"`);

  // 12. Run initial migration
  const migrationFile = resolve(root, "drizzle", "0001_initial.sql");
  if (existsSync(migrationFile)) {
    p.log.step("Running initial migration...");
    run(
      `npx wrangler d1 execute ${projectName}-d1 --local --file=drizzle/0001_initial.sql`
    );
    p.log.success("Migration applied");
  } else {
    p.log.warning("drizzle/0001_initial.sql not found — generate with: bun run db:generate");
  }

  // Done
  p.outro(
    `Setup complete! Run:\n  bun dev\n\nR2 uploads are optional — leave R2_ACCESS_KEY_ID blank to skip.\nSee CLAUDE.md § Onboarding Guide for R2 setup.\n\nTo deploy:\n  bun run deploy`
  );
}

main().catch((err) => {
  p.log.error(err.message);
  process.exit(1);
});
