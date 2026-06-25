begin;

create extension if not exists pgcrypto;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_roles (
  code text primary key,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.priority_levels (
  code text primary key,
  name text not null,
  sort_order smallint not null,
  tone text not null default 'slate',
  sla_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.action_statuses (
  code text primary key,
  name text not null,
  sort_order smallint not null,
  tone text not null default 'slate',
  is_terminal boolean not null default false,
  requires_completion_date boolean not null default false,
  requires_verification_date boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.source_types (
  code text primary key,
  name text not null,
  sort_order smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recommendation_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order smallint not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  employee_code text unique,
  full_name text not null,
  email text not null unique,
  department_id uuid references public.departments (id) on delete set null,
  role_code text not null references public.app_roles (code) on update cascade,
  job_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  source_no text not null unique,
  source_type_code text not null references public.source_types (code) on update cascade,
  title text not null,
  reference_no text,
  source_date date not null,
  department_id uuid references public.departments (id) on delete set null,
  summary text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  recommendation_no text not null,
  recommendation_text text not null,
  category_id uuid references public.recommendation_categories (id) on delete set null,
  priority_code text references public.priority_levels (code) on update cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recommendations_source_recommendation_no_uniq unique (source_id, recommendation_no)
);

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  action_no text not null,
  title text not null,
  description text,
  responsible_user_id uuid references public.profiles (id) on delete set null,
  responsible_name_manual text,
  owner_user_id uuid references public.profiles (id) on delete set null,
  owner_name_manual text,
  verifier_user_id uuid references public.profiles (id) on delete set null,
  verifier_name_manual text,
  priority_code text not null references public.priority_levels (code) on update cascade,
  status_code text not null references public.action_statuses (code) on update cascade,
  start_date date,
  due_date date not null,
  completed_date date,
  verified_date date,
  progress_percent numeric(5,2) not null default 0,
  latest_extension_until date,
  extension_reason text,
  evidence_summary text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint actions_progress_percent_check check (progress_percent >= 0 and progress_percent <= 100),
  constraint actions_due_after_start_check check (start_date is null or due_date >= start_date),
  constraint actions_completed_after_start_check check (completed_date is null or start_date is null or completed_date >= start_date),
  constraint actions_verified_after_completed_check check (verified_date is null or completed_date is null or verified_date >= completed_date),
  constraint actions_recommendation_action_no_uniq unique (recommendation_id, action_no)
);

create table if not exists public.action_updates (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions (id) on delete cascade,
  update_date timestamptz not null default timezone('utc', now()),
  progress_note text not null,
  progress_percent numeric(5,2),
  status_code text references public.action_statuses (code) on update cascade,
  next_follow_up_date date,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint action_updates_progress_percent_check check (
    progress_percent is null or (progress_percent >= 0 and progress_percent <= 100)
  )
);

create table if not exists public.action_attachments (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions (id) on delete cascade,
  bucket_name text not null default 'action-evidence',
  file_name text not null,
  file_path text not null unique,
  mime_type text,
  file_size_bytes bigint,
  description text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.action_extension_requests (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions (id) on delete cascade,
  requested_until date not null,
  reason text not null,
  request_status text not null default 'pending'
    check (request_status in ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by uuid references public.profiles (id) on delete set null,
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.action_history (
  id bigint generated always as identity primary key,
  action_id uuid not null references public.actions (id) on delete cascade,
  field_name text not null,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default timezone('utc', now()),
  change_source text not null default 'app'
);

create index if not exists idx_profiles_department_id on public.profiles (department_id);
create index if not exists idx_profiles_role_code on public.profiles (role_code);
create index if not exists idx_sources_source_type_code on public.sources (source_type_code);
create index if not exists idx_sources_department_id on public.sources (department_id);
create index if not exists idx_sources_source_date on public.sources (source_date);
create index if not exists idx_recommendations_source_id on public.recommendations (source_id);
create index if not exists idx_recommendations_category_id on public.recommendations (category_id);
create index if not exists idx_recommendations_priority_code on public.recommendations (priority_code);
create index if not exists idx_actions_recommendation_id on public.actions (recommendation_id);
create index if not exists idx_actions_responsible_user_id on public.actions (responsible_user_id);
create index if not exists idx_actions_owner_user_id on public.actions (owner_user_id);
create index if not exists idx_actions_verifier_user_id on public.actions (verifier_user_id);
create index if not exists idx_actions_priority_code on public.actions (priority_code);
create index if not exists idx_actions_status_code on public.actions (status_code);
create index if not exists idx_actions_due_date on public.actions (due_date);
create index if not exists idx_actions_start_date on public.actions (start_date);
create index if not exists idx_action_updates_action_id on public.action_updates (action_id);
create index if not exists idx_action_updates_updated_by on public.action_updates (updated_by);
create index if not exists idx_action_extension_requests_action_id on public.action_extension_requests (action_id);
create index if not exists idx_action_extension_requests_status on public.action_extension_requests (request_status);
create index if not exists idx_action_attachments_action_id on public.action_attachments (action_id);
create index if not exists idx_action_history_action_id on public.action_history (action_id);
create index if not exists idx_action_history_changed_at on public.action_history (changed_at desc);

commit;
