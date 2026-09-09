create extension if not exists pgcrypto;

create type public.question_type as enum ('single_choice','multiple_choice','true_false','text','number','matching','ordering','case');
create type public.study_mode as enum ('learning','exam','mistakes','weak_topics');
create type public.attempt_status as enum ('in_progress','completed','abandoned');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order integer not null default 0,
  unique(subject_id, slug)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order integer not null default 0,
  unique(section_id, slug)
);

create table public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order integer not null default 0,
  unique(topic_id, slug)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  edition text,
  external_ref text,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  stable_code text not null unique,
  question_type public.question_type not null,
  subject_id uuid not null references public.subjects(id),
  section_id uuid references public.sections(id),
  topic_id uuid references public.topics(id),
  subtopic_id uuid references public.subtopics(id),
  source_id uuid references public.sources(id),
  source_variant text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.question_revisions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  revision_no integer not null check (revision_no > 0),
  prompt text not null,
  explanation text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  unique(question_id, revision_no)
);

create table public.answer_options (
  id uuid primary key default gen_random_uuid(),
  question_revision_id uuid not null references public.question_revisions(id) on delete cascade,
  option_key text not null,
  body text not null,
  is_correct boolean not null default false,
  feedback text,
  sort_order integer not null default 0,
  unique(question_revision_id, option_key)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null
);

create table public.question_tags (
  question_id uuid not null references public.questions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key(question_id, tag_id)
);

create table public.test_definitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject_id uuid references public.subjects(id),
  is_published boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.test_questions (
  test_definition_id uuid not null references public.test_definitions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  sort_order integer not null default 0,
  primary key(test_definition_id, question_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_definition_id uuid references public.test_definitions(id),
  mode public.study_mode not null,
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  correct_count integer,
  question_count integer,
  score numeric(6,3)
);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  question_revision_id uuid not null references public.question_revisions(id),
  selected_option_ids uuid[] not null default '{}',
  text_answer text,
  numeric_answer numeric,
  is_correct boolean,
  response_time_ms integer check (response_time_ms is null or response_time_ms >= 0),
  answered_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

create table public.review_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  stage integer not null default 0,
  consecutive_correct integer not null default 0,
  due_at timestamptz not null default now(),
  last_result boolean,
  updated_at timestamptz not null default now(),
  primary key(user_id, question_id)
);

create table public.review_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  attempt_answer_id uuid references public.attempt_answers(id) on delete set null,
  result boolean not null,
  stage_before integer not null,
  stage_after integer not null,
  reviewed_at timestamptz not null default now()
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  file_name text not null,
  format text not null check (format in ('xlsx','csv','docx')),
  status text not null check (status in ('uploaded','validating','needs_review','ready','importing','completed','failed')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  row_number integer,
  field_name text,
  code text not null,
  message text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_questions_topic on public.questions(topic_id) where is_active;
create index idx_question_revisions_question on public.question_revisions(question_id, revision_no desc);
create index idx_attempts_user_started on public.attempts(user_id, started_at desc);
create index idx_attempt_answers_attempt on public.attempt_answers(attempt_id);
create index idx_review_items_due on public.review_items(user_id, due_at);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.sections enable row level security;
alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.sources enable row level security;
alter table public.questions enable row level security;
alter table public.question_revisions enable row level security;
alter table public.answer_options enable row level security;
alter table public.tags enable row level security;
alter table public.question_tags enable row level security;
alter table public.test_definitions enable row level security;
alter table public.test_questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.review_items enable row level security;
alter table public.review_history enable row level security;

create policy "public curriculum read" on public.subjects for select using (is_active);
create policy "public section read" on public.sections for select using (true);
create policy "public topic read" on public.topics for select using (true);
create policy "public subtopic read" on public.subtopics for select using (true);
create policy "public source read" on public.sources for select using (true);
create policy "public question read" on public.questions for select using (is_active);
create policy "public revision read" on public.question_revisions for select using (true);
create policy "public option read" on public.answer_options for select using (true);
create policy "public tag read" on public.tags for select using (true);
create policy "public question tag read" on public.question_tags for select using (true);
create policy "published tests read" on public.test_definitions for select using (is_published);
create policy "published test questions read" on public.test_questions for select using (exists (select 1 from public.test_definitions td where td.id = test_definition_id and td.is_published));

create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own attempts all" on public.attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own attempt answers all" on public.attempt_answers for all using (exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid())) with check (exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid()));
create policy "own review items all" on public.review_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own review history all" on public.review_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
