#!/usr/bin/env node
/**
 * Создаёт в Stripe продукт "Premium" и две цены (месячная и годовая),
 * выводит ID для .env.local.
 * Требует STRIPE_SECRET_KEY в .env.local.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

function parseEnv(content) {
  const out = {};
  for (const line of (content || "").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

if (!fs.existsSync(envPath)) {
  console.error("Файл .env.local не найден. Создайте его и укажите STRIPE_SECRET_KEY.");
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const secretKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!secretKey || !secretKey.startsWith("sk_")) {
  console.error("В .env.local должен быть указан STRIPE_SECRET_KEY (начинается с sk_test_ или sk_live_).");
  process.exit(1);
}

const Stripe = require("stripe");
const stripe = new Stripe(secretKey);

async function main() {
  console.log("Создание продукта Premium и цен в Stripe...\n");

  const product = await stripe.products.create({
    name: "Premium",
    description: "Премиум подписка: расширенный прогноз, без рекламы, приоритетная поддержка",
  });
  console.log("Продукт создан:", product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 499, // $4.99
    currency: "usd",
    recurring: { interval: "month" },
  });
  console.log("Месячная цена создана:", monthlyPrice.id);

  const annualPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 4900, // $49.00
    currency: "usd",
    recurring: { interval: "year" },
  });
  console.log("Годовая цена создана:", annualPrice.id);

  const monthlyKey = "STRIPE_MONTHLY_PRICE_ID";
  const annualKey = "STRIPE_ANNUAL_PRICE_ID";
  let envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");
  const out = [];
  let monthlyDone = false;
  let annualDone = false;
  for (const line of lines) {
    if (line.startsWith(monthlyKey + "=")) {
      out.push(`${monthlyKey}=${monthlyPrice.id}`);
      monthlyDone = true;
      continue;
    }
    if (line.startsWith(annualKey + "=")) {
      out.push(`${annualKey}=${annualPrice.id}`);
      annualDone = true;
      continue;
    }
    out.push(line);
  }
  if (!monthlyDone) out.push(`${monthlyKey}=${monthlyPrice.id}`);
  if (!annualDone) out.push(`${annualKey}=${annualPrice.id}`);
  fs.writeFileSync(envPath, out.join("\n").trimEnd() + "\n", "utf8");

  console.log("\n✅ .env.local обновлён: STRIPE_MONTHLY_PRICE_ID, STRIPE_ANNUAL_PRICE_ID");
  console.log("\n--- Webhook (для выдачи премиума после оплаты) ---");
  console.log("Локально: stripe listen --forward-to localhost:3000/api/stripe/webhook");
  console.log("Продакшен: Dashboard → Webhooks → URL вашего сайта/api/stripe/webhook");
  console.log("");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
