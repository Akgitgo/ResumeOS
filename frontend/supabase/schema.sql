-- ============================================================
-- ATS Resume App - Database Schema (Supabase / Postgres)
-- Run in Supabase SQL editor. Idempotent-ish (drops not included
-- on purpose - run on a fresh project).
-- ============================================================

-- Master profile (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  linkedin text,
  github text,
  portfolio text,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  company text not null,
  location text,
  start_date date,
  end_date date,
  is_current boolean default false,
  bullets jsonb default '[]'::jsonb,   -- array of strings
  tags text[] default '{}',            -- e.g. ["data-analysis","ai"]
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  link text,
  description text,
  technologies text[] default '{}',
  bullets jsonb default '[]'::jsonb,
  tags text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  degree text not null,
  institution text not null,
  location text,
  start_date date,
  end_date date,
  gpa text,
  honors text,
  sort_order int default 0
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  category text not null,   -- e.g. "Technical", "Tools", "Soft Skills"
  items text[] default '{}',
  sort_order int default 0
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  issuer text,
  date date,
  link text
);

create table public.awards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  date date,
  description text
);

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  proficiency text
);

create table public.others (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  category text not null,  -- "Volunteer" | "Publications" | "Hobbies" | ...
  title text not null,
  description text,
  date date
);

-- Job descriptions the user pastes/uploads
create table public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  title text,
  company text,
  raw_text text not null,
  parsed_keywords jsonb default '[]'::jsonb,  -- extracted keyword list
  created_at timestamptz default now()
);

-- A tailored resume = chosen sections + AI-rewritten content for one JD
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  jd_id uuid references public.job_descriptions(id) on delete set null,
  name text not null default 'Untitled Resume',
  sections jsonb not null default '[]'::jsonb,   -- ordered list of section keys
  content jsonb not null default '{}'::jsonb,    -- {sectionKey: renderedContent}
  formatting_meta jsonb default '{}'::jsonb,      -- flags: hasTables, hasImages, columns, fonts
  status text default 'draft',                    -- draft | final
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Per-ATS scores for a resume version
create table public.resume_scores (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade,
  ats_name text not null,            -- workday | taleo | icims | greenhouse | lever | successfactors
  score numeric not null,            -- 0-100
  breakdown jsonb default '{}'::jsonb,    -- per-criterion sub-scores
  suggestions jsonb default '[]'::jsonb,  -- list of actionable strings
  created_at timestamptz default now()
);

-- Logs for AI provider chain (debugging / fallback monitoring)
create table public.ai_provider_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  provider text not null,
  model text,
  status text not null,   -- success | error | fallback
  error_message text,
  created_at timestamptz default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_experiences_profile on public.experiences(profile_id);
create index idx_projects_profile on public.projects(profile_id);
create index idx_education_profile on public.education(profile_id);
create index idx_skills_profile on public.skills(profile_id);
create index idx_certs_profile on public.certifications(profile_id);
create index idx_awards_profile on public.awards(profile_id);
create index idx_languages_profile on public.languages(profile_id);
create index idx_others_profile on public.others(profile_id);
create index idx_jd_profile on public.job_descriptions(profile_id);
create index idx_resumes_profile on public.resumes(profile_id);
create index idx_scores_resume on public.resume_scores(resume_id);

-- ============================================================
-- Row Level Security: every table is owned by profile_id == auth.uid()
-- ============================================================
alter table public.profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.projects enable row level security;
alter table public.education enable row level security;
alter table public.skills enable row level security;
alter table public.certifications enable row level security;
alter table public.awards enable row level security;
alter table public.languages enable row level security;
alter table public.others enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_scores enable row level security;
alter table public.ai_provider_logs enable row level security;

-- profiles: user can only see/edit their own row
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- generic pattern for child tables keyed by profile_id
create policy "experiences_owner" on public.experiences
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "projects_owner" on public.projects
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "education_owner" on public.education
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "skills_owner" on public.skills
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "certs_owner" on public.certifications
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "awards_owner" on public.awards
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "languages_owner" on public.languages
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "others_owner" on public.others
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "jd_owner" on public.job_descriptions
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "resumes_owner" on public.resumes
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "scores_owner" on public.resume_scores
  for all using (
    auth.uid() = (select profile_id from public.resumes r where r.id = resume_id)
  );
create policy "ai_logs_owner" on public.ai_provider_logs
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- ============================================================
-- Auto-create profile row on signup
-- ============================================================
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
