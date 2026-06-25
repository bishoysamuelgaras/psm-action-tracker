begin;

create or replace function public.set_role_permissions(
  p_role_code text,
  p_permission_codes text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_permission_code text;
begin
  if not public.has_role_permission('settings.roles.manage') then
    raise exception 'Permission denied: settings.roles.manage is required.';
  end if;

  if not exists (
    select 1
    from public.app_roles
    where code = p_role_code
  ) then
    raise exception 'Unknown role code: %', p_role_code;
  end if;

  delete from public.role_permissions where role_code = p_role_code;

  foreach v_permission_code in array coalesce(p_permission_codes, '{}'::text[])
  loop
    insert into public.role_permissions (role_code, permission_code)
    values (p_role_code, v_permission_code)
    on conflict do nothing;
  end loop;
end;
$$;

grant execute on function public.set_role_permissions(text, text[]) to authenticated;

drop policy if exists role_permissions_manage_admin_manager on public.role_permissions;
create policy role_permissions_manage_admin_manager
on public.role_permissions
for all
to authenticated
using (public.has_role_permission('settings.roles.manage'))
with check (public.has_role_permission('settings.roles.manage'));

commit;
