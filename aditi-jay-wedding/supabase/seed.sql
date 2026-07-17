-- ============================================================================
-- SEED DATA
-- Run after 0001_init.sql and 0002_storage.sql, and after your admin user
-- has signed up at least once (so profiles has a row to reference).
-- ============================================================================

insert into events (name, slug, color_key, event_date, venue, description, sort_order) values
  ('Mehendi', 'mehendi', 'mehendi', '2027-01-30', 'Family Residence, Garden Lawn', 'Henna ceremony for the bride and family.', 1),
  ('Haldi', 'haldi', 'haldi', '2027-01-31', 'Family Residence, Courtyard', 'Turmeric ceremony for bride and groom.', 2),
  ('Hasthmelap', 'hasthmelap', 'hasthmelap', '2027-02-02', 'Wedding Hall, Main Venue', 'The core wedding ritual — hand-joining ceremony.', 3),
  ('Gruhshanti', 'gruhshanti', 'gruhshanti', '2027-01-29', 'Family Residence, Puja Room', 'Pre-wedding house blessing ritual.', 4),
  ('Sangeet', 'sangeet', 'sangeet', '2027-01-31', 'Banquet Hall', 'Music and dance celebration night.', 5)
on conflict (slug) do nothing;

insert into vendors (name, category, phone, advance_paid, total_quote, rating, notes) values
  ('Radiant Frames Photography', 'Photographer', '9820011223', 50000, 180000, 4.5, 'Confirmed for all 5 events, 2 photographers + 1 videographer.'),
  ('Royal Decor Studio', 'Decorator', '9820033445', 75000, 320000, 4.0, 'Stage + mandap + entrance decor across venues.'),
  ('Spice Route Caterers', 'Catering', '9820055667', 100000, 650000, 4.5, 'Veg + Jain menu confirmed, 400 pax.'),
  ('Glow Bridal Makeup', 'Makeup', '9820077889', 20000, 65000, 5.0, 'Bridal + family makeup, trial booked.'),
  ('Mehendi by Meera', 'Mehendi Artist', '9820099001', 5000, 25000, 4.5, '4 artists for Mehendi day.'),
  ('DJ Vortex', 'DJ', '9820022334', 15000, 45000, 4.0, 'Sangeet + reception sound and lighting.'),
  ('Grand Palace Banquets', 'Venue', '9820044556', 200000, 900000, 4.0, 'Hasthmelap + reception venue, 2 halls booked.'),
  ('Bloom & Bud Florists', 'Flowers', '9820066778', 10000, 80000, 4.0, 'Fresh flowers for mandap and stage.'),
  ('Heritage Jewels', 'Jeweler', '9820088990', 0, 0, null, 'Rental jewelry consultation scheduled.')
on conflict do nothing;

insert into shopping_items (event_id, category, name, quantity, budget_amount, actual_amount, store, purchased) values
  ((select id from events where slug = 'hasthmelap'), 'Clothes', 'Bridal Lehenga', 1, 120000, 115000, 'Kalki Fashion', true),
  ((select id from events where slug = 'hasthmelap'), 'Clothes', 'Groom Sherwani', 1, 60000, null, 'Manyavar', false),
  ((select id from events where slug = 'haldi'), 'Clothes', 'Haldi Outfits (Yellow)', 2, 15000, null, 'Local Boutique', false),
  ((select id from events where slug = 'hasthmelap'), 'Jewelry', 'Bridal Jewelry Set', 1, 200000, null, 'Heritage Jewels', false),
  ((select id from events where slug = 'sangeet'), 'Decorations', 'Sangeet Backdrop', 1, 40000, null, 'Royal Decor Studio', false),
  ((select id from events where slug = 'mehendi'), 'Return Gifts', 'Mehendi Favor Boxes', 150, 22500, null, 'Etsy India', false),
  ((select id from events where slug = 'hasthmelap'), 'Wedding Cards', 'Invitation Cards', 400, 60000, 58000, 'PrintCraft', true)
on conflict do nothing;

insert into guests (name, group_type, side, rsvp_status, invitation_sent, food_preference, phone) values
  ('Radhika Shah', 'Family', 'Bride', 'Confirmed', true, 'Veg', '9812300001'),
  ('Karan Mehta', 'Friends', 'Groom', 'Pending', true, 'Non-Veg', '9812300002'),
  ('Dr. Anjali Desai', 'VIP', 'Bride', 'Confirmed', true, 'Jain', '9812300003'),
  ('Rohan Kapoor', 'Friends', 'Groom', 'Declined', true, 'Veg', '9812300004')
on conflict do nothing;

insert into budget_lines (event_id, category, planned_amount, actual_amount, vendor_id, notes) values
  ((select id from events where slug = 'hasthmelap'), 'Venue', 900000, 200000, (select id from vendors where name = 'Grand Palace Banquets'), 'Advance paid, balance due 15 days before.'),
  ((select id from events where slug = 'hasthmelap'), 'Catering', 650000, 100000, (select id from vendors where name = 'Spice Route Caterers'), 'Final headcount due 1 month prior.'),
  ((select id from events where slug = 'sangeet'), 'Entertainment', 45000, 15000, (select id from vendors where name = 'DJ Vortex'), null),
  ((select id from events where slug = 'mehendi'), 'Mehendi Artist', 25000, 5000, (select id from vendors where name = 'Mehendi by Meera'), null)
on conflict do nothing;

-- Sample tasks — replace created_by / assignee inserts with real profile IDs
-- once your admin and family members have signed in at least once.
insert into tasks (event_id, name, description, category, priority, status, due_date, completion) values
  ((select id from events where slug = 'hasthmelap'), 'Finalize venue decor theme', 'Confirm maroon-gold mandap theme with Royal Decor Studio.', 'Decor', 'High', 'In Progress', '2026-11-15', 40),
  ((select id from events where slug = 'hasthmelap'), 'Confirm final catering headcount', 'Lock guest count with Spice Route Caterers.', 'Catering', 'Critical', 'Not Started', '2027-01-01', 0),
  ((select id from events where slug = 'mehendi'), 'Book mehendi artists', 'Confirm 4 artists for the full day.', 'Vendors', 'Medium', 'Completed', '2026-09-01', 100),
  ((select id from events where slug = 'sangeet'), 'Finalize sangeet performance lineup', 'Collect family performance list and running order.', 'Program', 'Medium', 'Waiting', '2026-12-20', 20),
  ((select id from events where slug = 'gruhshanti'), 'Arrange puja samagri', 'Coordinate with priest for full list of items.', 'Rituals', 'High', 'Not Started', '2026-12-01', 0)
on conflict do nothing;

-- ============================================================================
-- VENDOR BOOKING TRACKER — sample bookings
-- Run after 0003_bookings.sql
-- ============================================================================
insert into vendor_bookings (vendor_name, category_key, event_id, status, booking_date, contract_signed, advance_paid, total_amount, final_payment_due_date, contact_person, contact_phone, trial_scheduled_date) values
  ('Grand Palace Banquets', 'venue', (select id from events where slug = 'hasthmelap'), 'Confirmed', '2026-05-01', true, 200000, 900000, '2027-01-15', 'Mr. Sharma', '9820044556', null),
  ('Spice Route Caterers', 'food_catering', (select id from events where slug = 'hasthmelap'), 'Booked', '2026-06-10', true, 100000, 650000, '2027-01-01', 'Ramesh', '9820055667', '2026-12-05T11:00:00+05:30'),
  ('Radiant Frames Photography', 'photographer', null, 'Confirmed', '2026-04-20', true, 50000, 180000, '2027-01-20', 'Vikram', '9820011223', null),
  ('Glow Bridal Makeup', 'makeup_artist', (select id from events where slug = 'hasthmelap'), 'Negotiating', null, false, 20000, 65000, null, 'Neha', '9820077889', '2026-11-15T10:00:00+05:30'),
  ('Kalki Fashion', 'wedding_clothes', (select id from events where slug = 'hasthmelap'), 'Booked', '2026-08-01', false, 40000, 115000, '2027-01-10', 'Priya', '9820012345', null),
  ('Mehendi by Meera', 'mehendi_artist', (select id from events where slug = 'mehendi'), 'Confirmed', '2026-07-15', true, 5000, 25000, '2027-01-25', 'Meera', '9820099001', null)
on conflict do nothing;
