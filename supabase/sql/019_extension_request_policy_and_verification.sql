begin;

alter table public.role_permissions
  drop constraint if exists role_permissions_permission_code_check;

alter table public.role_permissions
  add constraint role_permissions_permission_code_check check (
    permission_code in (
      'dashboard.view',
      'sources.manage',
      'recommendations.manage',
      'actions.manage',
      'actions.assigned_update',
      'actions.extensions.approve',
      'actions.verify',
      'reports.view',
      'logs.view',
      'settings.users.manage',
      'settings.roles.manage'
    )
  );

insert into public.role_permissions (role_code, permission_code)
values
  ('admin', 'actions.extensions.approve'),
  ('admin', 'actions.verify'),
  ('psm_manager', 'actions.extensions.approve'),
  ('psm_manager', 'actions.verify')
on conflict do nothing;

create or replace function public.is_action_responsible_or_owner(p_action_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.actions a
    where a.id = p_action_id
      and auth.uid() is not null
      and auth.uid() in (a.responsible_user_id, a.owner_user_id)
  );
$$;

drop policy if exists action_extension_requests_insert_admin_or_participant on public.action_extension_requests;
create policy action_extension_requests_insert_responsible_or_owner
on public.action_extension_requests
for insert
to authenticated
with check (
  public.is_action_responsible_or_owner(action_id)
);

drop policy if exists action_extension_requests_manage_admin_manager on public.action_extension_requests;
create policy action_extension_requests_manage_with_permission
on public.action_extension_requests
for update
to authenticated
using (public.has_role_permission('actions.extensions.approve'))
with check (public.has_role_permission('actions.extensions.approve'));

drop policy if exists action_extension_requests_delete_admin_manager on public.action_extension_requests;
create policy action_extension_requests_delete_with_permission
on public.action_extension_requests
for delete
to authenticated
using (public.has_role_permission('actions.extensions.approve'));

drop policy if exists actions_verify_permission_update on public.actions;
create policy actions_verify_permission_update
on public.actions
for update
to authenticated
using (public.has_role_permission('actions.verify'))
with check (public.has_role_permission('actions.verify'));

drop policy if exists action_history_insert_admin_or_participant on public.action_history;
create policy action_history_insert_manage_participant_or_verifier
on public.action_history
for insert
to authenticated
with check (
  public.has_role_permission('actions.manage')
  or public.has_role_permission('actions.verify')
  or public.is_action_participant(action_id)
);

commit;
