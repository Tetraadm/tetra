-- ============================================================================
-- TETRA HMS DATABASE SCHEMA
-- ============================================================================
-- This file contains the complete database schema for Tetra HMS
-- Run this in Supabase SQL Editor to create all tables, RLS policies, and constraints
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations table
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now() not null
);

-- Teams table
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  org_id uuid not null references organizations(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('admin', 'teamleader', 'employee')),
  org_id uuid not null references organizations(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Folders table (for organizing instructions)
create table if not exists public.folders (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  org_id uuid not null references organizations(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- Instructions table
create table if not exists public.instructions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  file_path text,
  folder_id uuid references folders(id) on delete set null,
  org_id uuid not null references organizations(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  keywords text[],
  created_at timestamptz default now() not null
);

-- Instruction-Team mapping (many-to-many)
create table if not exists public.instruction_teams (
  instruction_id uuid not null references instructions(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  primary key (instruction_id, team_id)
);

-- Instruction reads tracking
create table if not exists public.instruction_reads (
  instruction_id uuid not null references instructions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  confirmed boolean default false,
  read_at timestamptz default now() not null,
  confirmed_at timestamptz,
  primary key (instruction_id, user_id)
);

-- Alerts table
create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  active boolean default true not null,
  org_id uuid not null references organizations(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- Alert-Team mapping (many-to-many)
create table if not exists public.alert_teams (
  alert_id uuid not null references alerts(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  primary key (alert_id, team_id)
);

-- Invites table
create table if not exists public.invites (
  id uuid primary key default uuid_generate_v4(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  org_id uuid not null references organizations(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  role text not null check (role in ('admin', 'teamleader', 'employee')),
  used boolean default false not null,
  created_at timestamptz default now() not null
);

-- Audit logs table
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action_type text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now() not null
);

-- Ask Tetra logs table (AI assistant queries)
create table if not exists public.ask_tetra_logs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  question text not null,
  answer text not null,
  source_instruction_id uuid references instructions(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.organizations enable row level security;
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.instructions enable row level security;
alter table public.instruction_teams enable row level security;
alter table public.instruction_reads enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_teams enable row level security;
alter table public.invites enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ask_tetra_logs enable row level security;

-- Organizations policies
create policy "Users can view their own organization"
  on organizations for select
  using (
    id in (select org_id from profiles where id = auth.uid())
  );

-- Teams policies
create policy "Users can view teams in their organization"
  on teams for select
  using (
    org_id in (select org_id from profiles where id = auth.uid())
  );

-- Profiles policies
create policy "Users can view profiles in their organization"
  on profiles for select
  using (
    org_id in (select org_id from profiles where id = auth.uid())
  );

-- Instructions policies
create policy "Users can view published instructions in their org"
  on instructions for select
  using (
    org_id in (select org_id from profiles where id = auth.uid())
    and status = 'published'
  );

-- Folders policies
create policy "Users can view folders in their organization"
  on folders for select
  using (
    org_id in (select org_id from profiles where id = auth.uid())
  );

-- Alerts policies
create policy "Users can view active alerts in their org"
  on alerts for select
  using (
    org_id in (select org_id from profiles where id = auth.uid())
    and active = true
  );

-- Admin read/write policies
create policy "Admins can view all instructions in their org"
  on instructions for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  );

create policy "Admins can manage teams"
  on teams for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = teams.org_id
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = teams.org_id
    )
  );

create policy "Admins can manage profiles in their org"
  on profiles for update, delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = profiles.org_id
    )
  );

create policy "Admins can manage folders"
  on folders for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = folders.org_id
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = folders.org_id
    )
  );

create policy "Admins can manage instructions"
  on instructions for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = instructions.org_id
    )
  );

create policy "Admins can manage instruction team links"
  on instruction_teams for all
  using (
    exists (
      select 1
      from profiles p
      join instructions i on i.id = instruction_teams.instruction_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = i.org_id
    )
  )
  with check (
    exists (
      select 1
      from profiles p
      join instructions i on i.id = instruction_teams.instruction_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = i.org_id
    )
  );

create policy "Admins can manage alerts"
  on alerts for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  );

create policy "Admins can manage alert team links"
  on alert_teams for all
  using (
    exists (
      select 1
      from profiles p
      join alerts a on a.id = alert_teams.alert_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = a.org_id
    )
  )
  with check (
    exists (
      select 1
      from profiles p
      join alerts a on a.id = alert_teams.alert_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = a.org_id
    )
  );

create policy "Admins can manage invites"
  on invites for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = invites.org_id
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = invites.org_id
    )
  );

create policy "Admins can view audit logs in their org"
  on audit_logs for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = audit_logs.org_id
    )
  );

create policy "Admins can insert audit logs in their org"
  on audit_logs for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = audit_logs.org_id
    )
    and (user_id is null or user_id = auth.uid())
  );

create policy "Users can insert ask tetra logs in their org"
  on ask_tetra_logs for insert
  with check (
    org_id in (select org_id from profiles where id = auth.uid())
    and (user_id is null or user_id = auth.uid())
  );

create policy "Admins can view ask tetra logs in their org"
  on ask_tetra_logs for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = ask_tetra_logs.org_id
    )
  );

-- Instruction reads policies
create policy "Users can insert their instruction reads"
  on instruction_reads for insert
  with check (
    user_id = auth.uid()
    and org_id in (select org_id from profiles where id = auth.uid())
  );

create policy "Users can update their instruction reads"
  on instruction_reads for update
  using (
    user_id = auth.uid()
  );

create policy "Users can view their instruction reads"
  on instruction_reads for select
  using (
    user_id = auth.uid()
  );

create policy "Admins can view instruction reads in their org"
  on instruction_reads for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = instruction_reads.org_id
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

create index if not exists idx_teams_org_id on teams(org_id);
create index if not exists idx_profiles_org_id on profiles(org_id);
create index if not exists idx_profiles_team_id on profiles(team_id);
create index if not exists idx_instructions_org_id on instructions(org_id);
create index if not exists idx_instructions_status on instructions(status);
create index if not exists idx_instruction_teams_team_id on instruction_teams(team_id);
create index if not exists idx_instruction_reads_user_id on instruction_reads(user_id);
create index if not exists idx_instruction_reads_org_id on instruction_reads(org_id);
create index if not exists idx_alerts_org_id on alerts(org_id);
create index if not exists idx_alerts_active on alerts(active);
create index if not exists idx_alert_teams_team_id on alert_teams(team_id);
create index if not exists idx_invites_token on invites(token);
create index if not exists idx_audit_logs_org_id on audit_logs(org_id);
create index if not exists idx_ask_tetra_logs_org_id on ask_tetra_logs(org_id);
