#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envExample = path.join(root, ".env.example");
const envLocal = path.join(root, ".env.local");

const defaultNextAuthUrl = "http://localhost:3000";

function parseEnv(content) {
  const out = {};
  for (const line of (content || "").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

function serializeEnv(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

let existing = {};
if (fs.existsSync(envLocal)) {
  existing = parseEnv(fs.readFileSync(envLocal, "utf8"));
}

const example = parseEnv(fs.readFileSync(envExample, "utf8"));
const merged = { ...example };

for (const [k, v] of Object.entries(existing)) {
  if (v !== undefined && v !== "") merged[k] = v;
}

if (!merged.NEXTAUTH_URL || merged.NEXTAUTH_URL === "http://localhost:3000") {
  merged.NEXTAUTH_URL = defaultNextAuthUrl;
}

const content = serializeEnv(merged);
fs.writeFileSync(envLocal, content + "\n", "utf8");

const callbackUrl = `${merged.NEXTAUTH_URL.replace(/\/$/, "")}/api/auth/callback/google`;
console.log("\n✅ .env.local обновлён. NEXTAUTH_URL:", merged.NEXTAUTH_URL);
console.log("\n📋 Добавьте этот URL в Google Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs:\n");
console.log("   " + callbackUrl + "\n");
console.log("Затем укажите GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET в .env.local и перезапустите: npm run dev\n");
