-- ============================================================================
-- STORAGE BUCKETS: receipts, event files, avatars
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('receipts', 'receipts', true),
  ('event-files', 'event-files', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Authenticated users can view files"
on storage.objects for select
using (bucket_id in ('receipts', 'event-files', 'avatars') and auth.role() = 'authenticated');

create policy "Authenticated users can upload files"
on storage.objects for insert
with check (bucket_id in ('receipts', 'event-files', 'avatars') and auth.role() = 'authenticated');

create policy "Owners or admins can update files"
on storage.objects for update
using (bucket_id in ('receipts', 'event-files', 'avatars') and auth.role() = 'authenticated');

create policy "Owners or admins can delete files"
on storage.objects for delete
using (bucket_id in ('receipts', 'event-files', 'avatars') and auth.role() = 'authenticated');
