# Weather & Currency Dashboard

A full-stack Next.js 14+ (App Router) application providing real-time weather, NBRB currency exchange rates, and a premium subscription tier with Stripe.

## Features

- **Real-time Weather** – City search or geolocation; current conditions + 5-day (free) / 7-day (premium) forecast via WeatherAPI.com.
- **Currency** – Official NBRB rates (USD, EUR, RUB, PLN, etc.) vs BYN and a simple converter.
- **Auth** – Google OAuth and email/password (Supabase Auth) via NextAuth.js; protected dashboard.
- **Database** – Supabase (PostgreSQL) for user profiles and subscription status.
- **Premium** – Stripe Checkout (monthly/annual); webhook updates subscription in DB.
- **Admin** – Admin-only panel: list users, search/paginate, view/edit user, change subscription, block/unblock.

## Tech Stack

- Next.js 14+ (App Router), TypeScript
- NextAuth.js (Google)
- Supabase (PostgreSQL)
- Stripe (Checkout + webhook)
- Tailwind CSS, shadcn/ui-style components
- Deployable on Vercel

## Setup

### 1. Clone and install

```bash
cd weather
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random string for JWT signing (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ADMIN_EMAIL` | Email that receives admin role (optional) |
| `WEATHERAPI_API_KEY` | WeatherAPI.com API key ([get one](https://www.weatherapi.com/my/)) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_MONTHLY_PRICE_ID` | Stripe Price ID for monthly plan |
| `STRIPE_ANNUAL_PRICE_ID` | Stripe Price ID for annual plan |

### 3. Database (Supabase)

Run the migration in the Supabase SQL editor (Dashboard → SQL Editor):

- `supabase/migrations/001_initial_schema.sql` (creates `user_profiles` only; email/password uses built-in Supabase Auth, no extra tables).

Or with Supabase CLI: `supabase db push`.

### 4. Google OAuth

1. Set **NEXTAUTH_URL** in `.env.local` to the URL you use:
   - Local: `NEXTAUTH_URL=http://localhost:3000`
   - Production: `NEXTAUTH_URL=https://your-domain.com`
2. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3. Create OAuth 2.0 Client ID (Web application).
4. In **Authorized redirect URIs** add **exactly**: `{NEXTAUTH_URL}/api/auth/callback/google`  
   Examples: `http://localhost:3000/api/auth/callback/google`, `https://your-domain.com/api/auth/callback/google`.
5. Put Client ID and Client Secret in `.env.local` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**If you get 404 after Google sign-in:** check that `NEXTAUTH_URL` matches the site you open (no trailing slash) and that the same URL is used in Google’s redirect URI.

### 5. Stripe

1. Create Products/Prices in Stripe Dashboard for monthly and annual plans.
2. Put the Price IDs in `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID`.
3. Webhook: add endpoint `https://your-domain.com/api/stripe/webhook`, event types: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Use the signing secret in `STRIPE_WEBHOOK_SECRET`.

### 6. Build (optional)

For a production build without real API keys, Supabase uses placeholders so the build completes. Stripe is lazy-loaded and won’t run at build time.

```bash
npm run build
```

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google to access the dashboard.

### 8. Admin

Set `ADMIN_EMAIL` in `.env.local` to the email that should have admin access. That user will see the Admin link and can open `/admin` to manage users.

## Project structure

- `src/app/` – App Router pages and API routes
- `src/components/` – UI and feature components
- `src/lib/` – Supabase client, utils
- `src/hooks/` – useToast
- `src/types/` – Shared types and NextAuth augmentation
- `supabase/migrations/` – SQL schema

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add all environment variables in Vercel project settings.
3. Set `NEXTAUTH_URL` to your production URL.
4. Update Google OAuth redirect URI and Stripe webhook URL to the production domain.

## License

MIT
