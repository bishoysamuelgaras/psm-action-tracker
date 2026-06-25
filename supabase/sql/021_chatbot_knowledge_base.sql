begin;

create table if not exists public.help_topics (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.help_intents (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.help_topics(id) on delete cascade,
  intent_key text not null unique,
  title_ar text not null,
  title_en text not null,
  answer_mode text not null default 'faq',
  scope_type text not null default 'product_only',
  priority integer not null default 100,
  is_active boolean not null default true,
  allow_guest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_intent_phrases (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references public.help_intents(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  phrase text not null,
  normalized_phrase text not null,
  weight numeric(5,2) not null default 1.0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (intent_id, locale, normalized_phrase)
);

create table if not exists public.help_answers (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references public.help_intents(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  short_answer text not null,
  detailed_answer text,
  steps jsonb not null default '[]'::jsonb,
  note_text text,
  warning_text text,
  related_question_labels jsonb not null default '[]'::jsonb,
  quick_actions jsonb not null default '[]'::jsonb,
  version_no integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (intent_id, locale, version_no)
);

create table if not exists public.help_page_contexts (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references public.help_intents(id) on delete cascade,
  page_key text not null,
  route_pattern text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (intent_id, page_key, route_pattern)
);

create table if not exists public.help_role_rules (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references public.help_intents(id) on delete cascade,
  role_code text,
  permission_code text,
  visibility_mode text not null default 'show_if_match',
  created_at timestamptz not null default now()
);

create table if not exists public.help_related_intents (
  id uuid primary key default gen_random_uuid(),
  source_intent_id uuid not null references public.help_intents(id) on delete cascade,
  related_intent_id uuid not null references public.help_intents(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (source_intent_id, related_intent_id)
);

create table if not exists public.chatbot_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.profiles(id) on delete set null,
  session_id text,
  page_key text,
  locale text,
  user_question text,
  matched_intent_key text,
  confidence numeric(5,2),
  was_helpful boolean,
  feedback_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_help_topics_key on public.help_topics(key);
create index if not exists idx_help_intents_topic_id on public.help_intents(topic_id);
create index if not exists idx_help_intents_priority on public.help_intents(priority, is_active);
create index if not exists idx_help_intent_phrases_intent_id on public.help_intent_phrases(intent_id);
create index if not exists idx_help_intent_phrases_locale on public.help_intent_phrases(locale);
create index if not exists idx_help_answers_intent_locale on public.help_answers(intent_id, locale, is_active);
create index if not exists idx_help_page_contexts_page_key on public.help_page_contexts(page_key, sort_order);
create index if not exists idx_chatbot_feedback_user_id on public.chatbot_feedback(user_id, created_at desc);

alter table public.help_topics enable row level security;
alter table public.help_intents enable row level security;
alter table public.help_intent_phrases enable row level security;
alter table public.help_answers enable row level security;
alter table public.help_page_contexts enable row level security;
alter table public.help_role_rules enable row level security;
alter table public.help_related_intents enable row level security;
alter table public.chatbot_feedback enable row level security;

drop policy if exists help_topics_read_authenticated on public.help_topics;
create policy help_topics_read_authenticated
on public.help_topics
for select
to authenticated
using (true);

drop policy if exists help_intents_read_authenticated on public.help_intents;
create policy help_intents_read_authenticated
on public.help_intents
for select
to authenticated
using (true);

drop policy if exists help_intent_phrases_read_authenticated on public.help_intent_phrases;
create policy help_intent_phrases_read_authenticated
on public.help_intent_phrases
for select
to authenticated
using (true);

drop policy if exists help_answers_read_authenticated on public.help_answers;
create policy help_answers_read_authenticated
on public.help_answers
for select
to authenticated
using (true);

drop policy if exists help_page_contexts_read_authenticated on public.help_page_contexts;
create policy help_page_contexts_read_authenticated
on public.help_page_contexts
for select
to authenticated
using (true);

drop policy if exists help_role_rules_read_authenticated on public.help_role_rules;
create policy help_role_rules_read_authenticated
on public.help_role_rules
for select
to authenticated
using (true);

drop policy if exists help_related_intents_read_authenticated on public.help_related_intents;
create policy help_related_intents_read_authenticated
on public.help_related_intents
for select
to authenticated
using (true);

drop policy if exists chatbot_feedback_insert_own on public.chatbot_feedback;
create policy chatbot_feedback_insert_own
on public.chatbot_feedback
for insert
to authenticated
with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));

commit;
