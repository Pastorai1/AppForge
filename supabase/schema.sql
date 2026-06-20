-- ───────────────────────────────────────────────────────────────
-- AppForge database schema
--
-- Run this in the Supabase SQL editor for your AppForge project.
-- (Use a DEDICATED Supabase project — do not run this against the
--  database for any other app.)
-- ───────────────────────────────────────────────────────────────

-- ── Profiles: one row per auth user, tracks billing plan ──
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Generations: one row per AI generation, for freemium metering ──
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_month_idx
  on public.generations (user_id, created_at);

alter table public.generations enable row level security;

create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

-- ── Projects: scored ideas tracked on the kanban board ──
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text default '',
  stage text not null default 'Scoping'
    check (stage in ('Scoping', 'Building', 'Review', 'Live')),
  score int,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "Users manage their own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Saved store listings (optional persistence) ──
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  app_name text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Users manage their own listings"
  on public.listings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Market analysis history ──
create table if not exists public.market_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists market_analyses_user_idx
  on public.market_analyses (user_id, created_at desc);

alter table public.market_analyses enable row level security;

create policy "Users manage their own market analyses"
  on public.market_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Viability score history ──
create table if not exists public.viability_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  idea text not null default '',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists viability_scores_user_idx
  on public.viability_scores (user_id, created_at desc);

alter table public.viability_scores enable row level security;

create policy "Users manage their own viability scores"
  on public.viability_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Tech stack recommendation history ──
create table if not exists public.tech_stacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default '',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists tech_stacks_user_idx
  on public.tech_stacks (user_id, created_at desc);

alter table public.tech_stacks enable row level security;

create policy "Users manage their own tech stacks"
  on public.tech_stacks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

