-- Create table for logging unanswered AI questions
create table if not exists public.ai_unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  question text not null,
  created_at timestamptz default now() not null
);

alter table public.ai_unanswered_questions enable row level security;

drop policy if exists "Users can insert ai unanswered questions in their org" on public.ai_unanswered_questions;
drop policy if exists "Admins can view ai unanswered questions in their org" on public.ai_unanswered_questions;

create policy "Users can insert ai unanswered questions in their org"
  on public.ai_unanswered_questions for insert
  with check (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and (user_id is null or user_id = auth.uid())
  );

create policy "Admins can view ai unanswered questions in their org"
  on public.ai_unanswered_questions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = ai_unanswered_questions.org_id
    )
  );

create index if not exists idx_ai_unanswered_questions_org_id on public.ai_unanswered_questions(org_id);
