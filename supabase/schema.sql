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

-- ── Build sessions: conversational app-builder history ──
create table if not exists public.build_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New build',
  reference_app text,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists build_sessions_user_idx
  on public.build_sessions (user_id, updated_at desc);

alter table public.build_sessions enable row level security;

create policy "Users manage their own build sessions"
  on public.build_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Saved items: bookmarked top apps / opportunities to revisit ──
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('top_app', 'opportunity')),
  item_key text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, item_key)
);

create index if not exists saved_items_user_idx
  on public.saved_items (user_id, kind, created_at desc);

alter table public.saved_items enable row level security;

create policy "Users manage their own saved items"
  on public.saved_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Brain: shared business-context facts the marketing tools read from ──
create table if not exists public.brain_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'Other',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brain_facts_user_idx
  on public.brain_facts (user_id, category, created_at);

alter table public.brain_facts enable row level security;

create policy "Users manage their own brain facts"
  on public.brain_facts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Chief of Staff: account-wide assistant conversation threads ──
create table if not exists public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_sessions_user_idx
  on public.staff_sessions (user_id, updated_at desc);

alter table public.staff_sessions enable row level security;

create policy "Users manage their own staff sessions"
  on public.staff_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Attractive Characters: reusable brand-voice profiles ──
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'New character',
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_user_idx
  on public.characters (user_id, updated_at desc);

alter table public.characters enable row level security;

create policy "Users manage their own characters"
  on public.characters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── One-to-Many Email sequences (history) ──
create table if not exists public.email_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  label text not null default '',
  topic text not null default '',
  character_name text not null default '',
  payload jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists email_sequences_user_idx
  on public.email_sequences (user_id, created_at desc);

alter table public.email_sequences enable row level security;

create policy "Users manage their own email sequences"
  on public.email_sequences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── One-to-Many Social content calendars (history) ──
create table if not exists public.social_calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null default '',
  character_name text not null default '',
  platforms jsonb not null default '[]',
  payload jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists social_calendars_user_idx
  on public.social_calendars (user_id, created_at desc);

alter table public.social_calendars enable row level security;

create policy "Users manage their own social calendars"
  on public.social_calendars for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── One-to-Many Ads sets (history) ──
create table if not exists public.ad_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null default '',
  character_name text not null default '',
  funnel_stage text not null default '',
  platforms jsonb not null default '[]',
  payload jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists ad_sets_user_idx
  on public.ad_sets (user_id, created_at desc);

alter table public.ad_sets enable row level security;

create policy "Users manage their own ad sets"
  on public.ad_sets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── One-to-Many Presentations (Perfect Webinar scripts, history) ──
create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null default '',
  character_name text not null default '',
  payload jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists presentations_user_idx
  on public.presentations (user_id, created_at desc);

alter table public.presentations enable row level security;

create policy "Users manage their own presentations"
  on public.presentations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

