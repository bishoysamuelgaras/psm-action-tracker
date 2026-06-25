begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'action-evidence',
  'action-evidence',
  false,
  52428800,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists action_evidence_select_authenticated on storage.objects;
create policy action_evidence_select_authenticated
on storage.objects
for select
to authenticated
using (bucket_id = 'action-evidence');

drop policy if exists action_evidence_insert_authenticated on storage.objects;
create policy action_evidence_insert_authenticated
on storage.objects
for insert
to authenticated
with check (bucket_id = 'action-evidence');

drop policy if exists action_evidence_update_authenticated on storage.objects;
create policy action_evidence_update_authenticated
on storage.objects
for update
to authenticated
using (bucket_id = 'action-evidence')
with check (bucket_id = 'action-evidence');

drop policy if exists action_evidence_delete_authenticated on storage.objects;
create policy action_evidence_delete_authenticated
on storage.objects
for delete
to authenticated
using (bucket_id = 'action-evidence');

commit;
