-- ============================================================================
-- VENDOR BOOKING TRACKER
-- A dedicated booking-status tracker, separate from the general `vendors`
-- directory. Run after 0001_init.sql and 0002_storage.sql.
-- ============================================================================

create type booking_status as enum (
  'Not Booked', 'Enquired', 'Negotiating', 'Booked', 'Confirmed', 'Cancelled'
);

-- Reference table of booking categories + their typical ideal-booking-by lead
-- time (days before the wedding/function date). Admin-editable.
create table booking_categories (
  key text primary key,
  label text not null,
  lead_days int not null,
  icon_key text not null default 'sparkles',
  is_custom boolean not null default false,
  sort_order int not null default 0
);

insert into booking_categories (key, label, lead_days, icon_key, sort_order) values
  ('venue', 'Venue', 270, 'building-2', 1),
  ('food_catering', 'Food Catering', 270, 'utensils', 2),
  ('photographer', 'Photographer', 240, 'camera', 3),
  ('videographer', 'Videographer', 240, 'video', 4),
  ('decoration', 'Decoration', 180, 'flower-2', 5),
  ('jeweler', 'Jeweler', 150, 'gem', 6),
  ('accommodation', 'Accommodation / Guest Hotel', 150, 'bed-double', 7),
  ('dj_sound', 'DJ / Sound', 120, 'music-4', 8),
  ('lighting', 'Lighting', 120, 'lightbulb', 9),
  ('makeup_artist', 'Makeup Artist', 120, 'sparkles', 10),
  ('wedding_clothes', 'Wedding Clothes / Tailor', 120, 'shirt', 11),
  ('mehendi_artist', 'Mehendi Artist', 90, 'hand', 12),
  ('invitation_cards', 'Invitation Cards Printing', 90, 'mail', 13),
  ('transportation', 'Transportation', 60, 'car', 14),
  ('flowers', 'Flowers', 45, 'flower', 15),
  ('others', 'Others', 60, 'more-horizontal', 99)
on conflict (key) do nothing;

create table vendor_bookings (
  id uuid primary key default uuid_generate_v4(),
  vendor_name text not null,
  category_key text not null references booking_categories(key),
  custom_category_label text,             -- used when category_key = 'others'
  event_id uuid references events(id) on delete set null,  -- "Wedding Function"
  status booking_status not null default 'Not Booked',
  booking_date date,
  contract_signed boolean not null default false,
  advance_paid numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  balance_due numeric(12,2) generated always as (total_amount - advance_paid) stored,
  final_payment_due_date date,
  contact_person text,
  contact_phone text,
  trial_scheduled_date timestamptz,        -- makeup / catering tasting
  fitting_dates date[] default '{}',       -- clothes fittings, multiple
  notes text,
  contract_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bookings_set_updated_at
  before update on vendor_bookings
  for each row execute procedure set_updated_at();

create or replace function log_booking_activity()
returns trigger as $$
begin
  insert into activity_log (profile_id, action, entity, entity_id)
  values (
    coalesce(new.created_by, (select id from profiles where id = auth.uid())),
    case when TG_OP = 'INSERT' then 'created' else 'updated' end,
    'booking',
    new.id
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_booking_change
  after insert or update on vendor_bookings
  for each row execute procedure log_booking_activity();

-- ----------------------------------------------------------------------------
-- RLS: read for all authenticated users, write for admins only (bookings are
-- a critical, high-stakes list — kept admin-controlled like vendors/budget).
-- ----------------------------------------------------------------------------
alter table booking_categories enable row level security;
alter table vendor_bookings enable row level security;

create policy "booking categories readable by all" on booking_categories
  for select using (auth.role() = 'authenticated');
create policy "booking categories writable by admin" on booking_categories
  for all using (is_admin()) with check (is_admin());

create policy "bookings readable by all" on vendor_bookings
  for select using (auth.role() = 'authenticated');
create policy "bookings writable by admin" on vendor_bookings
  for all using (is_admin()) with check (is_admin());

alter publication supabase_realtime add table vendor_bookings;
alter publication supabase_realtime add table booking_categories;

-- Storage bucket for signed contracts
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', true)
on conflict (id) do nothing;

create policy "Authenticated users can view contracts"
on storage.objects for select
using (bucket_id = 'contracts' and auth.role() = 'authenticated');

create policy "Authenticated users can upload contracts"
on storage.objects for insert
with check (bucket_id = 'contracts' and auth.role() = 'authenticated');

create policy "Authenticated users can update contracts"
on storage.objects for update
using (bucket_id = 'contracts' and auth.role() = 'authenticated');

create policy "Authenticated users can delete contracts"
on storage.objects for delete
using (bucket_id = 'contracts' and auth.role() = 'authenticated');
