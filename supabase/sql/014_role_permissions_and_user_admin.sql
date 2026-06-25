begin;

create table if not exists public.role_permissions (
  role_code text not null references public.app_roles (code) on delete cascade,
  permission_code text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint role_permissions_pkey primary key (role_code, permission_code),
  constraint role_permissions_permission_code_check check (
    permission_code in (
      'dashboard.view',
      'sources.manage',
      'recommendations.manage',
      'actions.manage',
      'actions.assigned_update',
      'reports.view',
      'settings.users.manage',
      'settings.roles.manage'
    )
  )
);

alter table public.role_permissions enable row level security;

create index if not exists idx_role_permissions_permission_code on public.role_permissions (permission_code);

insert into public.role_permissions (role_code, permission_code)
values
  ('admin', 'dashboard.view'),
  ('admin', 'sources.manage'),
  ('admin', 'recommendations.manage'),
  ('admin', 'actions.manage'),
  ('admin', 'actions.assigned_update'),
  ('admin', 'reports.view'),
  ('admin', 'settings.users.manage'),
  ('admin', 'settings.roles.manage'),
  ('psm_manager', 'dashboard.view'),
  ('psm_manager', 'sources.manage'),
  ('psm_manager', 'recommendations.manage'),
  ('psm_manager', 'actions.manage'),
  ('psm_manager', 'actions.assigned_update'),
  ('psm_manager', 'reports.view'),
  ('psm_manager', 'settings.users.manage'),
  ('psm_manager', 'settings.roles.manage'),
  ('action_owner', 'dashboard.view'),
  ('action_owner', 'actions.assigned_update'),
  ('action_owner', 'reports.view'),
  ('viewer', 'dashboard.view'),
  ('viewer', 'reports.view')
on conflict do nothing;

create or replace function public.has_role_permission(p_permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_code = p.role_code
    where p.id = auth.uid()
      and p.is_active = true
      and rp.permission_code = p_permission_code
  );
$$;

drop policy if exists role_permissions_select_authenticated on public.role_permissions;
create policy role_permissions_select_authenticated
on public.role_permissions
for select
to authenticated
using (true);

drop policy if exists role_permissions_manage_admin_manager on public.role_permissions;
create policy role_permissions_manage_admin_manager
on public.role_permissions
for all
to authenticated
using (public.current_role() in ('admin', 'psm_manager'))
with check (public.current_role() in ('admin', 'psm_manager'));

drop policy if exists app_roles_manage_admin_manager on public.app_roles;
create policy app_roles_manage_admin_manager
on public.app_roles
for all
to authenticated
using (public.has_role_permission('settings.roles.manage'))
with check (public.has_role_permission('settings.roles.manage'));

drop policy if exists profiles_manage_admin_manager on public.profiles;
create policy profiles_manage_admin_manager
on public.profiles
for all
to authenticated
using (public.has_role_permission('settings.users.manage'))
with check (public.has_role_permission('settings.users.manage'));

drop policy if exists sources_manage_admin_manager on public.sources;
create policy sources_manage_admin_manager
on public.sources
for all
to authenticated
using (public.has_role_permission('sources.manage'))
with check (public.has_role_permission('sources.manage'));

drop policy if exists recommendations_manage_admin_manager on public.recommendations;
create policy recommendations_manage_admin_manager
on public.recommendations
for all
to authenticated
using (public.has_role_permission('recommendations.manage'))
with check (public.has_role_permission('recommendations.manage'));

drop policy if exists actions_manage_admin_manager on public.actions;
create policy actions_manage_admin_manager
on public.actions
for all
to authenticated
using (public.has_role_permission('actions.manage'))
with check (public.has_role_permission('actions.manage'));

drop policy if exists action_updates_modify_admin_manager on public.action_updates;
create policy action_updates_modify_admin_manager
on public.action_updates
for update
to authenticated
using (public.has_role_permission('actions.manage'))
with check (public.has_role_permission('actions.manage'));

drop policy if exists action_updates_delete_admin_manager on public.action_updates;
create policy action_updates_delete_admin_manager
on public.action_updates
for delete
to authenticated
using (public.has_role_permission('actions.manage'));

drop policy if exists action_attachments_delete_admin_or_uploader on public.action_attachments;
create policy action_attachments_delete_admin_or_uploader
on public.action_attachments
for delete
to authenticated
using (
  public.has_role_permission('actions.manage') or uploaded_by = auth.uid()
);

drop policy if exists action_extension_requests_manage_admin_manager on public.action_extension_requests;
create policy action_extension_requests_manage_admin_manager
on public.action_extension_requests
for update
to authenticated
using (public.has_role_permission('actions.manage'))
with check (public.has_role_permission('actions.manage'));

drop policy if exists action_extension_requests_delete_admin_manager on public.action_extension_requests;
create policy action_extension_requests_delete_admin_manager
on public.action_extension_requests
for delete
to authenticated
using (public.has_role_permission('actions.manage'));

drop policy if exists action_history_insert_admin_or_participant on public.action_history;
create policy action_history_insert_admin_or_participant
on public.action_history
for insert
to authenticated
with check (
  public.has_role_permission('actions.manage') or public.is_action_participant(action_id)
);

commit;
