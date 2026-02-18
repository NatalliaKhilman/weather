-- User profiles (synced with NextAuth; id = provider user id, e.g. Google sub)
create table if not exists public.user_profiles (
  id text primary key,
  email text not null unique,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'premium')),
  subscription_start timestamptz,
  subscription_end timestamptz,
  is_blocked boolean not null default false,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_email on public.user_profiles(email);
create index if not exists idx_user_profiles_role on public.user_profiles(role);

-- RLS: allow service role full access; anon/authenticated read own row only if needed
alter table public.user_profiles enable row level security;

-- Service role bypasses RLS; app uses SUPABASE_SERVICE_ROLE_KEY for API routes
-- Optional: policy for authenticated users to read their own profile
create policy "Users can read own profile"
  on public.user_profiles for select
  to authenticated
  using (auth.uid()::text = id);

comment on table public.user_profiles is 'User profiles and subscription state; id = NextAuth/Google or Supabase Auth user id.';
