begin;

alter table public.departments enable row level security;
alter table public.app_roles enable row level security;
alter table public.priority_levels enable row level security;
alter table public.action_statuses enable row level security;
alter table public.source_types enable row level security;
alter table public.recommendation_categories enable row level security;
alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.recommendations enable row level security;
alter table public.actions enable row level security;
alter table public.action_updates enable row level security;
alter table public.action_attachments enable row level security;
alter table public.action_extension_requests enable row level security;
alter table public.action_history enable row level security;

-- Master data

drop policy if exists departments_select_authenticated on public.departments;
create policy departments_select_authenticated
on public.departments
for select
to authenticated
using (true);

drop policy if exists departments_manage_admin_manager on public.departments;
create policy departments_manage_admin_manager
on public.departments
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

drop policy if exists app_roles_select_authenticated on public.app_roles;
create policy app_roles_select_authenticated
on public.app_roles
for select
to authenticated
using (true);

drop policy if exists app_roles_manage_admin_manager on public.app_roles;
create policy app_roles_manage_admin_manager
on public.app_roles
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

drop policy if exists priority_levels_select_authenticated on public.priority_levels;
create policy priority_levels_select_authenticated
on public.priority_levels
for select
to authenticated
using (true);

drop policy if exists priority_levels_manage_admin_manager on public.priority_levels;
create policy priority_levels_manage_admin_manager
on public.priority_levels
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

drop policy if exists action_statuses_select_authenticated on public.action_statuses;
create policy action_statuses_select_authenticated
on public.action_statuses
for select
to authenticated
using (true);

drop policy if exists action_statuses_manage_admin_manager on public.action_statuses;
create policy action_statuses_manage_admin_manager
on public.action_statuses
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

drop policy if exists source_types_select_authenticated on public.source_types;
create policy source_types_select_authenticated
on public.source_types
for select
to authenticated
using (true);

drop policy if exists source_types_manage_admin_manager on public.source_types;
create policy source_types_manage_admin_manager
on public.source_types
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

drop policy if exists recommendation_categories_select_authenticated on public.recommendation_categories;
create policy recommendation_categories_select_authenticated
on public.recommendation_categories
for select
to authenticated
using (true);

drop policy if exists recommendation_categories_manage_admin_manager on public.recommendation_categories;
create policy recommendation_categories_manage_admin_manager
on public.recommendation_categories
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

-- Profiles

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
on public.profiles
for select
to authenticated
using (true);

drop policy if exists profiles_manage_admin_manager on public.profiles;
create policy profiles_manage_admin_manager
on public.profiles
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

-- Sources and recommendations

drop policy if exists sources_select_authenticated on public.sources;
create policy sources_select_authenticated
on public.sources
for select
to authenticated
using (true);

drop policy if exists sources_manage_admin_manager on public.sources;
create policy sources_manage_admin_manager
on public.sources
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

drop policy if exists recommendations_select_authenticated on public.recommendations;
create policy recommendations_select_authenticated
on public.recommendations
for select
to authenticated
using (true);

drop policy if exists recommendations_manage_admin_manager on public.recommendations;
create policy recommendations_manage_admin_manager
on public.recommendations
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

-- Actions

drop policy if exists actions_select_authenticated on public.actions;
create policy actions_select_authenticated
on public.actions
for select
to authenticated
using (true);

drop policy if exists actions_manage_admin_manager on public.actions;
create policy actions_manage_admin_manager
on public.actions
for all
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

-- Action updates

drop policy if exists action_updates_select_authenticated on public.action_updates;
create policy action_updates_select_authenticated
on public.action_updates
for select
to authenticated
using (true);

drop policy if exists action_updates_insert_admin_or_participant on public.action_updates;
create policy action_updates_insert_admin_or_participant
on public.action_updates
for insert
to authenticated
with check (
  public.is_admin_or_manager() or public.is_action_participant(action_id)
);

drop policy if exists action_updates_modify_admin_manager on public.action_updates;
create policy action_updates_modify_admin_manager
on public.action_updates
for update
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

drop policy if exists action_updates_delete_admin_manager on public.action_updates;
create policy action_updates_delete_admin_manager
on public.action_updates
for delete
to authenticated
using (public.is_admin_or_manager());

-- Attachments

drop policy if exists action_attachments_select_authenticated on public.action_attachments;
create policy action_attachments_select_authenticated
on public.action_attachments
for select
to authenticated
using (true);

drop policy if exists action_attachments_insert_admin_or_participant on public.action_attachments;
create policy action_attachments_insert_admin_or_participant
on public.action_attachments
for insert
to authenticated
with check (
  public.is_admin_or_manager() or public.is_action_participant(action_id)
);

drop policy if exists action_attachments_delete_admin_or_uploader on public.action_attachments;
create policy action_attachments_delete_admin_or_uploader
on public.action_attachments
for delete
to authenticated
using (
  public.is_admin_or_manager() or uploaded_by = auth.uid()
);

-- Extension requests

drop policy if exists action_extension_requests_select_authenticated on public.action_extension_requests;
create policy action_extension_requests_select_authenticated
on public.action_extension_requests
for select
to authenticated
using (true);

drop policy if exists action_extension_requests_insert_admin_or_participant on public.action_extension_requests;
create policy action_extension_requests_insert_admin_or_participant
on public.action_extension_requests
for insert
to authenticated
with check (
  public.is_admin_or_manager() or public.is_action_participant(action_id)
);

drop policy if exists action_extension_requests_manage_admin_manager on public.action_extension_requests;
create policy action_extension_requests_manage_admin_manager
on public.action_extension_requests
for update
to authenticated
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());

drop policy if exists action_extension_requests_delete_admin_manager on public.action_extension_requests;
create policy action_extension_requests_delete_admin_manager
on public.action_extension_requests
for delete
to authenticated
using (public.is_admin_or_manager());

-- History

drop policy if exists action_history_select_authenticated on public.action_history;
create policy action_history_select_authenticated
on public.action_history
for select
to authenticated
using (true);

drop policy if exists action_history_insert_admin_or_participant on public.action_history;
create policy action_history_insert_admin_or_participant
on public.action_history
for insert
to authenticated
with check (
  public.is_admin_or_manager() or public.is_action_participant(action_id)
);

commit;
