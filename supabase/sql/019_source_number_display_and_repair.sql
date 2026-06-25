-- Step 19 - Source number protection and one-time safe repair helper
-- Purpose:
-- 1) Prevent a source update from accidentally clearing source_no.
-- 2) Safely repair the known blank incident number if exactly one blank incident source exists.

begin;

create or replace function public.prevent_blank_source_no_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source_no is null or btrim(new.source_no) = '' then
    new.source_no := old.source_no;
  end if;

  if new.source_no is null or btrim(new.source_no) = '' then
    new.source_no := public.generate_source_no(new.source_type_code, new.source_date);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sources_prevent_blank_source_no on public.sources;
create trigger trg_sources_prevent_blank_source_no
before update on public.sources
for each row
execute function public.prevent_blank_source_no_on_update();

commit;

-- Optional one-time repair for the incident mentioned by the user.
-- This block updates ONLY if there is exactly one blank Incident Investigation source
-- and INC-2026-001 is not already used. If more than one blank source exists, it does nothing.
with blank_incident_sources as (
  select id
  from public.sources
  where source_type_code = 'incident_investigation'
    and (source_no is null or btrim(source_no) = '')
), guard as (
  select count(*) as blank_count from blank_incident_sources
), repaired as (
  update public.sources s
  set
    source_no = 'INC-2026-001',
    updated_at = timezone('utc', now())
  from blank_incident_sources b, guard g
  where s.id = b.id
    and g.blank_count = 1
    and not exists (
      select 1
      from public.sources existing
      where existing.source_no = 'INC-2026-001'
        and existing.id <> s.id
    )
  returning s.id, s.source_no, s.title, s.source_date, s.reference_no
)
select * from repaired;

-- If the query above returns no rows, run this preview and update the exact id manually:
-- select id, source_no, reference_no, title, source_date, updated_at
-- from public.sources
-- where source_type_code = 'incident_investigation'
-- order by updated_at desc;
--
-- update public.sources
-- set source_no = 'INC-2026-001', updated_at = timezone('utc', now())
-- where id = '<paste-source-id-here>';
