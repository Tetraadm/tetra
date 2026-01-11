-- Add updated_at to instructions with trigger for automatic updates

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'instructions'
      and column_name = 'updated_at'
  ) then
    alter table public.instructions
      add column updated_at timestamptz;
  end if;
end $$;

update public.instructions
set updated_at = now()
where updated_at is null;

alter table public.instructions
  alter column updated_at set default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_instructions_updated_at on public.instructions;
create trigger set_instructions_updated_at
before update on public.instructions
for each row
execute function public.set_updated_at();
