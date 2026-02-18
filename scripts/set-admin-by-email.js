#!/usr/bin/env node
/**
 * Set role=admin for a user by email (e.g. after adding them to ADMIN_EMAIL in .env.local).
 * Usage: node scripts/set-admin-by-email.js [email]
 * Example: node scripts/set-admin-by-email.js oot2022@mail.ru
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/set-admin-by-email.js <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.error("Or run in Supabase SQL Editor:");
  console.error(`  update public.user_profiles set role = 'admin' where email = '${email}';`);
  process.exit(1);
}

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ role: "admin", updated_at: new Date().toISOString() })
    .eq("email", email)
    .select("id, email, role");

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log("No user found with email:", email);
    console.log("They will get admin role when they sign in (if in ADMIN_EMAIL).");
    process.exit(0);
  }
  console.log("Updated to admin:", data[0].email);
}

main();
