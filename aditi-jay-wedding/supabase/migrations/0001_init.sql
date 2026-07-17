-- ============================================================================
-- ADITI & JAY WEDDING PLANNER — INITIAL SCHEMA
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type user_role as enum ('admin', 'family', 'volunteer');
create type task_priority as enum ('Critical', 'High', 'Medium', 'Low');
create type task_status as enum ('Not Started', 'In Progress', 'Waiting', 'Blocked', 'Completed', 'Cancelled');
create type rsvp_status as enum ('Pending', 'Confirmed', 'Declined');
create type guest_group as enum ('Family', 'Friends', 'VIP');
create type guest_side as enum ('Bride', 'Groom', 'Both');
create type food_pref as enum ('Veg', 'Non-Veg', 'Jain', 'Vegan');

-- ----------------------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'New User',
  role user_role not null default 'volunteer',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'volunteer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ----------------------------------------------------------------------------
-- EVENTS (Mehendi, Haldi, Hasthmelap, Sangeet, Gruhshanti, + custom)
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  color_key text not null default 'mehendi',
  event_date date,
  venue text,
  description text,
  is_archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TASKS
-- ----------------------------------------------------------------------------
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete set null,
  name text not null,
  description text,
  category text,
  priority task_priority not null default 'Medium',
  status task_status not null default 'Not Started',
  due_date date,
  completion int not null default 0 check (completion between 0 and 100),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_assignees (
  task_id uuid references tasks(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (task_id, profile_id)
);

create table checklist_items (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  sort_order int not null default 0
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- SHOPPING
-- ----------------------------------------------------------------------------
create table shopping_items (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete set null,
  category text not null,
  name text not null,
  quantity int not null default 1,
  budget_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2),
  store text,
  purchased boolean not null default false,
  assigned_to uuid references profiles(id) on delete set null,
  receipt_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- BUDGET
-- ----------------------------------------------------------------------------
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  phone text,
  advance_paid numeric(12,2) not null default 0,
  total_quote numeric(12,2) not null default 0,
  balance numeric(12,2) generated always as (total_quote - advance_paid) stored,
  rating numeric(2,1) check (rating between 0 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create table budget_lines (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete set null,
  category text not null,
  planned_amount numeric(12,2) not null default 0,
  actual_amount numeric(12,2) not null default 0,
  vendor_id uuid references vendors(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- GUESTS
-- ----------------------------------------------------------------------------
create table guests (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  group_type guest_group not null default 'Family',
  side guest_side not null default 'Both',
  rsvp_status rsvp_status not null default 'Pending',
  invitation_sent boolean not null default false,
  food_preference food_pref not null default 'Veg',
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ACTIVITY LOG + NOTES + NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete set null,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at trigger for tasks
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute procedure set_updated_at();

-- Notify assignees + log activity whenever a task is inserted/assigned.
create or replace function notify_task_assignee()
returns trigger as $$
begin
  insert into notifications (profile_id, title, body)
  select new.profile_id, 'New task assigned', t.name
  from tasks t where t.id = new.task_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_task_assignee_created
  after insert on task_assignees
  for each row execute procedure notify_task_assignee();

create or replace function log_task_activity()
returns trigger as $$
begin
  insert into activity_log (profile_id, action, entity, entity_id)
  values (
    coalesce(new.created_by, (select id from profiles where id = auth.uid())),
    case when TG_OP = 'INSERT' then 'created' else 'updated' end,
    'task',
    new.id
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_task_change
  after insert or update on tasks
  for each row execute procedure log_task_activity();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Everyone who is authenticated can read almost everything (it's one wedding,
-- one shared workspace). Writes are restricted: admins can do anything,
-- members can only edit tasks/checklist items assigned to them.
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table events enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table checklist_items enable row level security;
alter table comments enable row level security;
alter table shopping_items enable row level security;
alter table vendors enable row level security;
alter table budget_lines enable row level security;
alter table guests enable row level security;
alter table activity_log enable row level security;
alter table notes enable row level security;
alter table notifications enable row level security;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

create or replace function is_task_assignee(t_id uuid)
returns boolean as $$
  select exists (
    select 1 from task_assignees where task_id = t_id and profile_id = auth.uid()
  );
$$ language sql security definer stable;

-- profiles: everyone can read, only the owner or an admin can update.
create policy "profiles are viewable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users can update their own profile" on profiles
  for update using (auth.uid() = id or is_admin());
create policy "admins can insert profiles" on profiles
  for insert with check (is_admin() or auth.uid() = id);

-- events: read for all, write for admin only.
create policy "events readable by all" on events for select using (auth.role() = 'authenticated');
create policy "events writable by admin" on events for insert with check (is_admin());
create policy "events updatable by admin" on events for update using (is_admin());
create policy "events deletable by admin" on events for delete using (is_admin());

-- tasks: read for all, insert by admin, update by admin OR assignee (limited use case
-- enforced further in the app layer for field-level restrictions), delete by admin.
create policy "tasks readable by all" on tasks for select using (auth.role() = 'authenticated');
create policy "tasks insertable by admin" on tasks for insert with check (is_admin());
create policy "tasks updatable by admin or assignee" on tasks for update
  using (is_admin() or is_task_assignee(id));
create policy "tasks deletable by admin" on tasks for delete using (is_admin());

create policy "task_assignees readable by all" on task_assignees for select using (auth.role() = 'authenticated');
create policy "task_assignees writable by admin" on task_assignees for all using (is_admin()) with check (is_admin());

create policy "checklist readable by all" on checklist_items for select using (auth.role() = 'authenticated');
create policy "checklist writable by admin or assignee" on checklist_items for all
  using (is_admin() or is_task_assignee(task_id)) with check (is_admin() or is_task_assignee(task_id));

create policy "comments readable by all" on comments for select using (auth.role() = 'authenticated');
create policy "comments insertable by authenticated" on comments for insert
  with check (auth.role() = 'authenticated' and profile_id = auth.uid());
create policy "comments deletable by admin or author" on comments for delete
  using (is_admin() or profile_id = auth.uid());

-- shopping / budget / vendors / guests: read for all, write for admin only.
create policy "shopping readable by all" on shopping_items for select using (auth.role() = 'authenticated');
create policy "shopping writable by admin" on shopping_items for all using (is_admin()) with check (is_admin());

create policy "vendors readable by all" on vendors for select using (auth.role() = 'authenticated');
create policy "vendors writable by admin" on vendors for all using (is_admin()) with check (is_admin());

create policy "budget readable by all" on budget_lines for select using (auth.role() = 'authenticated');
create policy "budget writable by admin" on budget_lines for all using (is_admin()) with check (is_admin());

create policy "guests readable by all" on guests for select using (auth.role() = 'authenticated');
create policy "guests writable by admin" on guests for all using (is_admin()) with check (is_admin());

create policy "activity readable by all" on activity_log for select using (auth.role() = 'authenticated');
create policy "activity insertable by system" on activity_log for insert with check (true);

create policy "notes readable by all" on notes for select using (auth.role() = 'authenticated');
create policy "notes writable by authenticated" on notes for insert with check (auth.role() = 'authenticated');
create policy "notes deletable by admin or author" on notes for delete using (is_admin() or author_id = auth.uid());

create policy "notifications readable by owner" on notifications for select using (profile_id = auth.uid());
create policy "notifications updatable by owner" on notifications for update using (profile_id = auth.uid());
create policy "notifications insertable by system" on notifications for insert with check (true);

-- ----------------------------------------------------------------------------
-- REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_assignees;
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table budget_lines;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table activity_log;
alter publication supabase_realtime add table events;
