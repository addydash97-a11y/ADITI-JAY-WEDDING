# Aditi & Jay — Wedding Planner

A premium, realtime wedding-planning dashboard built with Next.js (App Router), Supabase,
Tailwind CSS, Framer Motion, and Recharts.

Wedding date: **2 February 2027**

---

## 1. What's included

- **Auth & roles** — Admin, Family Member, Volunteer (Supabase Auth + `profiles` table + RLS)
- **Dashboard** — countdown, progress rings, urgent tasks, today's tasks, event grid, budget snapshot, activity feed, realtime updates
- **Events** — Mehendi, Haldi, Hasthmelap, Sangeet, Gruhshanti seeded by default; admins can add/archive events dynamically. Each event has its own Overview / Tasks / Budget / Shopping / Notes tabs.
- **Tasks** — Kanban (drag-and-drop), Table, List, and Calendar views; checklist, comments, assignees, priority, status, due date, completion %; confetti on completion
- **Shopping planner** — categorized items, budget vs. actual, purchased/pending toggle
- **Budget** — planned vs. actual by category, bar chart, vendor linkage
- **Guests** — RSVP tracking, side/group/food-preference filters, search, WhatsApp deep links
- **Vendors** — general vendor directory: category, advance/balance tracking, ratings, WhatsApp deep links
- **Vendor Booking Tracker** (`/bookings`) — a dedicated, festive booking-status board separate
  from the general vendor directory. Covers all 16 required booking categories (Venue, Catering,
  Photographer, Videographer, Decoration, Makeup, Clothes/Tailor, Mehendi, DJ/Sound, Lighting,
  Transportation, Flowers, Jeweler, Invitation Printing, Accommodation, and a custom "Others").
  Each booking tracks status (Not Booked → Enquired → Negotiating → Booked → Confirmed /
  Cancelled), contract signed, advance/total/balance, final payment due date, contact person +
  phone, trial/tasting dates (makeup, clothes, catering), fitting dates (clothes), notes, and a
  contract file upload. The dashboard shows total/confirmed/pending/overdue counts, a category
  grid color-coded Red/Orange/Yellow/Green by urgency (based on each category's typical
  ideal-booking-by lead time vs. days remaining to the wedding — e.g. Venue/Catering ~9 months
  out, Makeup/Clothes ~4 months out), an upcoming trials & fittings list, and confetti when a
  vendor is confirmed. Overdue unbooked categories are red-flagged on the homepage too.
- **Dark/light mode**, notifications panel, activity log — all realtime via Supabase

This is a working foundation covering every module in the brief. Some deeper admin
conveniences (bulk task edit, drag-drop file uploads, full guest CSV import, push
notifications) are stubbed at the data-model level (tables + RLS already exist) and are
straightforward to extend — see "Extending" below.

---

## 2. Prerequisites

- Node.js 18.18+ and npm
- A free [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account (for deployment)

---

## 3. Set up Supabase

1. Create a new Supabase project.
2. Open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_storage.sql`
   - `supabase/migrations/0003_bookings.sql` (vendor booking tracker + `contracts` storage bucket)
3. Go to **Authentication → Providers** and make sure **Email** sign-up is enabled.
   (Optional: turn off "Confirm email" while testing, in Authentication → Settings.)
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Sign up in the app once (see step 5) with the account you want to be **Admin**, then in
   **Table Editor → profiles**, change that row's `role` to `admin`.
6. (Optional but recommended) Run `supabase/seed.sql` in the SQL Editor to load sample
   events, vendors, shopping items, guests, and tasks so the dashboard isn't empty on
   first login.

---

## 4. Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local with your Supabase URL + anon key
npm run dev
```

Visit `http://localhost:3000`, sign up, then promote yourself to `admin` in Supabase as
described above.

---

## 5. Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel
```

Or via the Vercel dashboard:

1. Push this project to a GitHub repo.
2. In Vercel, **Add New Project** → import the repo.
3. Add environment variables (from `.env.example`) in **Settings → Environment Variables**.
4. Deploy. Vercel will build with `next build` automatically.

No other configuration is required — Supabase handles auth, database, storage, and
realtime; Vercel just serves the Next.js app.

---

## 6. Roles & permissions

| Action | Admin | Family / Volunteer |
|---|---|---|
| View everything | ✅ | ✅ |
| Create/edit/delete events | ✅ | ❌ |
| Create/delete tasks, assign people | ✅ | ❌ |
| Edit a task **assigned to them** (status, completion, checklist) | ✅ | ✅ |
| Add comments | ✅ | ✅ |
| Manage shopping, budget, guests, vendors, bookings | ✅ | ❌ (read-only) |

Admins can add new events any time from `/events`, and can either **archive** (soft, reversible —
hides it from active views but keeps its tasks/budget/etc.) or **permanently delete** an event
(tasks/budget lines/shopping items linked to it are kept but unlinked, not deleted). Tasks can be
added to any newly created event immediately — it shows up in the event picker as soon as it's
created.

All of this is enforced at the database level via Postgres Row Level Security policies in
`0001_init.sql` — not just hidden in the UI — so it's safe even if someone calls the API directly.

To change someone's role, edit their row in **Table Editor → profiles** (or build an
admin UI on top of the existing `profiles` table + RLS).

---

## 7. Project structure

```
app/
  page.tsx                 → Dashboard homepage
  login/page.tsx            → Sign in / sign up
  events/page.tsx           → Event list + create/archive
  events/[id]/page.tsx      → Single event workspace (tabs)
  tasks/page.tsx             → Kanban / Table / List / Calendar
  bookings/page.tsx         → Vendor Booking Tracker dashboard
  shopping/page.tsx         → Shopping planner
  budget/page.tsx           → Budget + chart
  guests/page.tsx           → Guest list + RSVP
  vendors/page.tsx          → Vendor directory
components/
  layout/                   → AppShell, Sidebar, Header
  dashboard/                → ProgressRing, CountdownTimer, NotificationPanel
  events/                   → EventCard
  tasks/                    → KanbanBoard, TaskCard, TaskModal
  bookings/                 → BookingModal, BookingCategoryIcon
lib/
  supabase/                 → browser/server/middleware clients
  types.ts                  → shared TypeScript types
  utils.ts                  → countdown, urgency, currency, WhatsApp helpers
  auth-context.tsx          → profile/role React context
supabase/
  migrations/0001_init.sql  → schema, RLS, triggers, realtime
  migrations/0002_storage.sql → storage buckets (receipts, event-files, avatars)
  seed.sql                  → sample data
```

---

## 8. Extending

- **File uploads (receipts, event files):** buckets `receipts`, `event-files`, `avatars`
  already exist with RLS policies. Use
  `supabase.storage.from('receipts').upload(path, file)` from any client component and
  save the returned path into `shopping_items.receipt_url` or a new `event_files` table.
- **Bulk task edit / duplicate:** the `tasks` table and RLS already support it — add a
  multi-select UI in `app/tasks/page.tsx` that loops `supabase.from('tasks').update(...)`.
- **Push/email notifications:** the `notifications` table + trigger
  (`notify_task_assignee`) already fire on assignment. Wire up a Supabase Edge Function
  or a service like Resend/OneSignal to turn those rows into emails/push notifications.
- **Analytics:** `recharts` is already installed; the Budget page shows one example
  (planned vs. actual bar chart) — add more charts the same way using data already in
  `tasks`, `shopping_items`, or `guests`.

---

## 9. Notes on the seed data

`supabase/seed.sql` inserts sample vendors, shopping items, guests, budget lines, and
tasks *without* assignees (since assignees need real `profiles.id` values created after
someone signs up). Once your family/volunteers have signed up, assign tasks to them from
the Tasks page — the "Assigned to" field in the task modal.
