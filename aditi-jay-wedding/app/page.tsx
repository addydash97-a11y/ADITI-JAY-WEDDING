'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Task, WeddingEvent, ShoppingItem, BudgetLine, ActivityLog, Profile, VendorBooking, BookingCategory } from '@/lib/types';
import ProgressRing from '@/components/dashboard/ProgressRing';
import CountdownTimer from '@/components/dashboard/CountdownTimer';
import EventCard from '@/components/events/EventCard';
import { getPlanningElapsedPct, getUrgency, URGENCY_COLORS, formatCurrency, cn, getBookingUrgency } from '@/lib/utils';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import Link from 'next/link';
import {
  AlertTriangle,
  ShoppingBag,
  Wallet,
  Users,
  Plus,
  ListChecks,
  Activity,
  ClipboardCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [budget, setBudget] = useState<BudgetLine[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [bookingCategories, setBookingCategories] = useState<BookingCategory[]>([]);

  useEffect(() => {
    async function load() {
      const [t, e, s, b, a, p, vb, bc] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('events').select('*').eq('is_archived', false).order('sort_order'),
        supabase.from('shopping_items').select('*'),
        supabase.from('budget_lines').select('*'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('profiles').select('*'),
        supabase.from('vendor_bookings').select('*'),
        supabase.from('booking_categories').select('*').order('sort_order'),
      ]);
      setTasks((t.data as Task[]) ?? []);
      setEvents((e.data as WeddingEvent[]) ?? []);
      setShopping((s.data as ShoppingItem[]) ?? []);
      setBudget((b.data as BudgetLine[]) ?? []);
      setActivity((a.data as ActivityLog[]) ?? []);
      setBookings((vb.data as VendorBooking[]) ?? []);
      setBookingCategories((bc.data as BookingCategory[]) ?? []);
      const map: Record<string, Profile> = {};
      ((p.data as Profile[]) ?? []).forEach((pr) => (map[pr.id] = pr));
      setProfiles(map);
    }
    load();

    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_lines' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_bookings' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const overallPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const eventCompletion = (eventId: string) => {
    const evTasks = tasks.filter((t) => t.event_id === eventId);
    if (!evTasks.length) return 0;
    return Math.round((evTasks.filter((t) => t.status === 'Completed').length / evTasks.length) * 100);
  };

  const urgentTasks = tasks
    .filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
    .filter((t) => ['critical', 'urgent'].includes(getUrgency(t.due_date)))
    .slice(0, 6);

  const todayTasks = tasks.filter((t) => t.due_date && isToday(new Date(t.due_date)));

  const totalBudgetPlanned = budget.reduce((sum, b) => sum + Number(b.planned_amount), 0);
  const totalBudgetActual = budget.reduce((sum, b) => sum + Number(b.actual_amount), 0);

  const shoppingPurchased = shopping.filter((s) => s.purchased).length;
  const shoppingPct = shopping.length ? Math.round((shoppingPurchased / shopping.length) * 100) : 0;

  const bestBookingByCategory: Record<string, VendorBooking> = {};
  const rank: Record<string, number> = { Cancelled: 0, 'Not Booked': 1, Enquired: 2, Negotiating: 3, Booked: 4, Confirmed: 5 };
  for (const b of bookings) {
    const cur = bestBookingByCategory[b.category_key];
    if (!cur || rank[b.status] > rank[cur.status]) bestBookingByCategory[b.category_key] = b;
  }
  const overdueBookingCategories = bookingCategories.filter((c) => {
    const best = bestBookingByCategory[c.key];
    return getBookingUrgency(best?.status ?? 'Not Booked', c.lead_days) === 'overdue';
  });

  return (
    <div className="animate-fade-up space-y-8">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-maroon-400 mt-1">Here&apos;s where the wedding stands today.</p>
          <div className="mt-4">
            <CountdownTimer />
          </div>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <ProgressRing percent={overallPct} label="Overall" sublabel={`${completedTasks}/${tasks.length} tasks`} />
          <ProgressRing percent={getPlanningElapsedPct()} label="Time Elapsed" size={110} />
        </div>
      </div>

      {/* Overdue bookings red-flag banner */}
      {overdueBookingCategories.length > 0 && (
        <Link
          href="/bookings"
          className="block rounded-2xl p-4 bg-gradient-to-r from-red-600 to-red-500 text-white shadow-soft hover:opacity-95 transition"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={22} className="shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">{overdueBookingCategories.length} vendor booking{overdueBookingCategories.length > 1 ? 's' : ''} overdue: </span>
              {overdueBookingCategories.map((c) => c.label).join(', ')} — book these now to stay on schedule.
            </div>
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/tasks" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold">
          <Plus size={16} /> Add Task
        </Link>
        <Link href="/bookings" className="flex items-center gap-2 px-4 py-2 rounded-xl card text-sm">
          <ClipboardCheck size={16} /> Bookings
        </Link>
        <Link href="/shopping" className="flex items-center gap-2 px-4 py-2 rounded-xl card text-sm">
          <ShoppingBag size={16} /> Shopping List
        </Link>
        <Link href="/budget" className="flex items-center gap-2 px-4 py-2 rounded-xl card text-sm">
          <Wallet size={16} /> Budget
        </Link>
        <Link href="/guests" className="flex items-center gap-2 px-4 py-2 rounded-xl card text-sm">
          <Users size={16} /> Guests
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={ListChecks} label="Today's Tasks" value={todayTasks.length} />
        <StatCard icon={AlertTriangle} label="Urgent Tasks" value={urgentTasks.length} accent="text-red-500" />
        <StatCard icon={ClipboardCheck} label="Bookings Overdue" value={overdueBookingCategories.length} accent="text-red-500" />
        <StatCard icon={ShoppingBag} label="Shopping Done" value={`${shoppingPct}%`} />
        <StatCard
          icon={Wallet}
          label="Budget Used"
          value={totalBudgetPlanned ? `${Math.round((totalBudgetActual / totalBudgetPlanned) * 100)}%` : '0%'}
        />
      </div>

      {/* Events grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-semibold">Events</h2>
          <Link href="/events" className="text-sm text-gold-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} completion={eventCompletion(ev.id)} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent tasks */}
        <div className="card p-5">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" /> Urgent &amp; Overdue
          </h3>
          {urgentTasks.length === 0 && <p className="text-sm text-maroon-400">Nothing urgent — well planned!</p>}
          <div className="space-y-2">
            {urgentTasks.map((t) => {
              const urgency = getUrgency(t.due_date);
              return (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span>{t.name}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', URGENCY_COLORS[urgency])}>
                    {t.due_date ? format(new Date(t.due_date), 'd MMM') : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <Activity size={18} className="text-gold-500" /> Recent Activity
          </h3>
          {activity.length === 0 && <p className="text-sm text-maroon-400">No activity yet.</p>}
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="text-sm flex justify-between">
                <span>
                  <span className="font-medium">{profiles[a.profile_id ?? '']?.full_name ?? 'Someone'}</span>{' '}
                  {a.action} a {a.entity}
                </span>
                <span className="text-xs text-maroon-400">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget snapshot */}
      <div className="card p-5">
        <h3 className="font-display font-semibold mb-3">Budget Snapshot</h3>
        <div className="flex items-center justify-between text-sm mb-2">
          <span>{formatCurrency(totalBudgetActual)} spent</span>
          <span className="text-maroon-400">of {formatCurrency(totalBudgetPlanned)} planned</span>
        </div>
        <div className="h-2.5 rounded-full bg-gold-100 dark:bg-maroon-800 overflow-hidden">
          <div
            className="h-full bg-maroon-gold rounded-full transition-all duration-700"
            style={{
              width: `${totalBudgetPlanned ? Math.min(100, (totalBudgetActual / totalBudgetPlanned) * 100) : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <Icon size={18} className={accent ?? 'text-gold-600'} />
      <div className="font-display text-2xl font-bold mt-2">{value}</div>
      <div className="text-xs text-maroon-400">{label}</div>
    </div>
  );
}
