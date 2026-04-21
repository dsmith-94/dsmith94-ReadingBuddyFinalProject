#!/usr/bin/env node
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "azure-dist");

function run(cmd, env = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

console.log("Building Reading Buddy for Azure App Service...");

if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

run("pnpm --filter @workspace/reading-buddy run build", {
  BASE_PATH: "/",
  PORT: "3000",
  NODE_ENV: "production",
});

run("pnpm --filter @workspace/api-server run build", {
  NODE_ENV: "production",
});

cpSync(
  resolve(root, "artifacts/api-server/dist"),
  out,
  { recursive: true },
);

cpSync(
  resolve(root, "artifacts/reading-buddy/dist/public"),
  resolve(out, "public"),
  { recursive: true },
);

writeFileSync(
  resolve(out, "package.json"),
  JSON.stringify(
    {
      name: "reading-buddy-azure",
      version: "1.0.0",
      private: true,
      type: "module",
      engines: { node: ">=20" },
      scripts: {
        start: "node --enable-source-maps ./index.mjs",
      },
    },
    null,
    2,
  ) + "\n",
);

writeFileSync(
  resolve(out, ".env.example"),
  [
    "# Azure App Service environment variables",
    "DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require",
    "STATIC_DIR=./public",
    "NODE_ENV=production",
    "# PORT is set automatically by Azure App Service",
    "",
  ].join("\n"),
);

console.log(`\nDone. Deployable bundle written to: ${out}`);
console.log("\nTo run locally:");
console.log(`  cd azure-dist && STATIC_DIR=./public PORT=3000 \\`);
console.log("    DATABASE_URL='postgres://...' node index.mjs");
