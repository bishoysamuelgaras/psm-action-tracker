begin;

alter table public.action_extension_requests
  add column if not exists previous_due_date date;

create or replace function public.can_request_action_extension(p_action_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_action_responsible_or_owner(p_action_id)
    or public.has_role_permission('actions.extensions.approve');
$$;

drop policy if exists action_extension_requests_insert_responsible_or_owner on public.action_extension_requests;
drop policy if exists action_extension_requests_insert_manage_or_participant on public.action_extension_requests;
create policy action_extension_requests_insert_manage_or_participant
on public.action_extension_requests
for insert
to authenticated
with check (
  public.can_request_action_extension(action_id)
);

create or replace function public.apply_approved_action_extension()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_due_date date;
begin
  if new.request_status = 'approved' and coalesce(old.request_status, '') <> 'approved' then
    select due_date
      into v_current_due_date
    from public.actions
    where id = new.action_id
    for update;

    if new.previous_due_date is null then
      new.previous_due_date := v_current_due_date;
    end if;

    update public.actions
      set due_date = new.requested_until,
          latest_extension_until = new.requested_until,
          extension_reason = coalesce(nullif(trim(new.reason), ''), extension_reason),
          updated_at = now()
    where id = new.action_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_approved_action_extension on public.action_extension_requests;
create trigger trg_apply_approved_action_extension
before update on public.action_extension_requests
for each row
execute function public.apply_approved_action_extension();

commit;
