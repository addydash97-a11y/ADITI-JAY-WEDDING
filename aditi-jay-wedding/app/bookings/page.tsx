'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { VendorBooking, BookingCategory, WeddingEvent, BookingStatus } from '@/lib/types';
import { BOOKING_STATUSES } from '@/lib/types';
import {
  formatCurrency,
  cn,
  getBookingUrgency,
  BOOKING_URGENCY_COLORS,
  BOOKING_URGENCY_LABELS,
  idealBookByDate,
  whatsappLink,
} from '@/lib/utils';
import { BookingCategoryIcon } from '@/components/bookings/BookingCategoryIcon';
import BookingModal from '@/components/bookings/BookingModal';
import ProgressRing from '@/components/dashboard/ProgressRing';
import { format, isFuture, isWithinInterval, addDays } from 'date-fns';
import { Plus, AlertTriangle, Sparkles, MessageCircle, Scissors, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

const STATUS_BADGE: Record<BookingStatus, string> = {
  'Not Booked': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  Enquired: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Negotiating: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  Booked: 'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300',
  Confirmed: 'bg-emerald2-100 text-emerald2-700 dark:bg-emerald2-950 dark:text-emerald2-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const STATUS_RANK: Record<BookingStatus, number> = {
  Cancelled: 0,
  'Not Booked': 1,
  Enquired: 2,
  Negotiating: 3,
  Booked: 4,
  Confirmed: 5,
};

export default function BookingsPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [categories, setCategories] = useState<BookingCategory[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [modal, setModal] = useState<{ booking: VendorBooking | null; categoryKey?: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  async function load() {
    const [{ data: b }, { data: c }, { data: e }] = await Promise.all([
      supabase.from('vendor_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('booking_categories').select('*').order('sort_order'),
      supabase.from('events').select('*').eq('is_archived', false).order('sort_order'),
    ]);
    setBookings((b as VendorBooking[]) ?? []);
    setCategories((c as BookingCategory[]) ?? []);
    setEvents((e as WeddingEvent[]) ?? []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('bookings-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_bookings' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Best (highest-progress) booking per category, for category-level status.
  const bestByCategory = useMemo(() => {
    const map: Record<string, VendorBooking> = {};
    for (const b of bookings) {
      const current = map[b.category_key];
      if (!current || STATUS_RANK[b.status] > STATUS_RANK[current.status]) {
        map[b.category_key] = b;
      }
    }
    return map;
  }, [bookings]);

  const totalCategories = categories.filter((c) => c.key !== 'others' || bookings.some((b) => b.category_key === 'others')).length;
  const confirmedCount = categories.filter((c) => bestByCategory[c.key]?.status === 'Confirmed').length;
  const pendingCount = categories.filter((c) => {
    const s = bestByCategory[c.key]?.status;
    return s && s !== 'Confirmed' && s !== 'Cancelled' && s !== 'Not Booked';
  }).length;
  const notBookedCount = totalCategories - confirmedCount - pendingCount;

  const overdueCategories = categories.filter((c) => {
    const best = bestByCategory[c.key];
    const urgency = getBookingUrgency(best?.status ?? 'Not Booked', c.lead_days);
    return urgency === 'overdue';
  });

  const overallPct = totalCategories ? Math.round((confirmedCount / totalCategories) * 100) : 0;

  const upcomingTrialsAndFittings = useMemo(() => {
    const items: { label: string; date: Date; vendor: string; kind: 'trial' | 'fitting' }[] = [];
    for (const b of bookings) {
      if (b.trial_scheduled_date && isFuture(new Date(b.trial_scheduled_date))) {
        items.push({ label: `${b.vendor_name} — trial`, date: new Date(b.trial_scheduled_date), vendor: b.vendor_name, kind: 'trial' });
      }
      for (const fd of b.fitting_dates ?? []) {
        const d = new Date(fd);
        if (isFuture(d)) {
          items.push({ label: `${b.vendor_name} — fitting`, date: d, vendor: b.vendor_name, kind: 'fitting' });
        }
      }
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);
  }, [bookings]);

  const filteredBookings = bookings
    .filter((b) => statusFilter === 'all' || b.status === statusFilter)
    .filter((b) => !selectedCategory || b.category_key === selectedCategory);

  async function quickUpdateStatus(b: VendorBooking, status: BookingStatus) {
    const { error } = await supabase.from('vendor_bookings').update({ status }).eq('id', b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (status === 'Confirmed') {
      confetti({ particleCount: 120, spread: 80, colors: ['#7d2436', '#d99420', '#c2185b', '#fdfaf4'] });
      toast.success(`${b.vendor_name} confirmed! 🎉`);
    }
    load();
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
            <PartyPopper className="text-gold-500" size={24} /> Vendor Booking Tracker
          </h1>
          <p className="text-sm text-maroon-400">Every must-have booking, one glance from panic-free.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModal({ booking: null })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold"
          >
            <Plus size={16} /> Add Booking
          </button>
        )}
      </div>

      {/* Overdue red-flag banner */}
      {overdueCategories.length > 0 && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-red-600 to-red-500 text-white flex items-center gap-3 shadow-soft animate-fade-up">
          <AlertTriangle size={22} className="shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">{overdueCategories.length} booking{overdueCategories.length > 1 ? 's' : ''} overdue: </span>
            {overdueCategories.map((c) => c.label).join(', ')} — these should already be locked in.
          </div>
        </div>
      )}

      {/* Stats + ring */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card p-5 flex items-center justify-center lg:col-span-1">
          <ProgressRing percent={overallPct} label="Confirmed" sublabel={`${confirmedCount}/${totalCategories}`} size={120} />
        </div>
        <StatTile label="Total Needed" value={totalCategories} icon={Sparkles} />
        <StatTile label="Confirmed" value={confirmedCount} icon={PartyPopper} accent="text-emerald2-600" />
        <StatTile label="Pending" value={pendingCount} icon={Scissors} accent="text-gold-600" />
        <StatTile label="Overdue" value={notBookedCount ? overdueCategories.length : 0} icon={AlertTriangle} accent="text-red-500" />
      </div>

      {/* Category grid */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Booking Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {categories
            .filter((c) => c.key !== 'others' || bookings.some((b) => b.category_key === 'others'))
            .map((c) => {
              const best = bestByCategory[c.key];
              const urgency = getBookingUrgency(best?.status ?? 'Not Booked', c.lead_days);
              const bookByDate = idealBookByDate(c.lead_days);
              return (
                <button
                  key={c.key}
                  onClick={() => (best ? setModal({ booking: best }) : setModal({ booking: null, categoryKey: c.key }))}
                  className={cn(
                    'text-left rounded-2xl p-4 border-2 transition-all hover:-translate-y-0.5 bg-white/80 dark:bg-maroon-900/40',
                    urgency === 'overdue' && 'border-red-400',
                    urgency === 'urgent' && 'border-orange-400',
                    urgency === 'upcoming' && 'border-yellow-400',
                    urgency === 'on-track' && 'border-gold-200/60 dark:border-gold-700/30',
                    urgency === 'done' && 'border-emerald2-400'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-maroon-gold flex items-center justify-center text-white">
                      <BookingCategoryIcon iconKey={c.icon_key} size={16} />
                    </div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', BOOKING_URGENCY_COLORS[urgency])}>
                      {BOOKING_URGENCY_LABELS[urgency]}
                    </span>
                  </div>
                  <div className="font-medium text-sm mt-2 leading-tight">{c.label}</div>
                  <div className="text-xs text-maroon-400 mt-1">{best ? best.vendor_name : 'Not booked yet'}</div>
                  {best ? (
                    <span className={cn('inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full', STATUS_BADGE[best.status])}>
                      {best.status}
                    </span>
                  ) : (
                    <div className="text-[10px] text-maroon-300 mt-2">Book by {format(bookByDate, 'd MMM yyyy')}</div>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming trials/fittings */}
        <div className="card p-5">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <Scissors size={18} className="text-gold-500" /> Upcoming Trials &amp; Fittings
          </h3>
          {upcomingTrialsAndFittings.length === 0 && (
            <p className="text-sm text-maroon-400">Nothing scheduled yet.</p>
          )}
          <div className="space-y-2">
            {upcomingTrialsAndFittings.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border',
                    isWithinInterval(item.date, { start: new Date(), end: addDays(new Date(), 7) })
                      ? 'bg-orange-100 text-orange-700 border-orange-300'
                      : 'bg-gold-50 text-gold-700 border-gold-200'
                  )}
                >
                  {format(item.date, item.kind === 'trial' ? 'd MMM, h:mm a' : 'd MMM')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick status board */}
        <div className="card p-5">
          <h3 className="font-display font-semibold mb-3">Quick Status Update</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {bookings.slice(0, 8).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm gap-2">
                <span className="truncate">{b.vendor_name}</span>
                <select
                  disabled={!isAdmin}
                  value={b.status}
                  onChange={(e) => quickUpdateStatus(b, e.target.value as BookingStatus)}
                  className={cn('text-xs px-2 py-1 rounded-full border-none shrink-0', STATUS_BADGE[b.status])}
                >
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-sm text-maroon-400">No bookings yet — add your first vendor above.</p>}
          </div>
        </div>
      </div>

      {/* Full table */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="font-display text-lg font-semibold">All Bookings</h2>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
              <option value="all">All statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={selectedCategory ?? ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-maroon-400 border-b border-gold-200/50 dark:border-gold-700/30">
                <th className="p-3">Vendor</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Contract</th>
                <th className="p-3">Advance / Total</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Final Due</th>
                <th className="p-3">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const cat = categories.find((c) => c.key === b.category_key);
                return (
                  <tr
                    key={b.id}
                    onClick={() => isAdmin && setModal({ booking: b })}
                    className="border-b border-gold-100/50 dark:border-gold-800/30 hover:bg-gold-50/50 dark:hover:bg-maroon-800/30 cursor-pointer"
                  >
                    <td className="p-3 font-medium">{b.vendor_name}</td>
                    <td className="p-3">{b.category_key === 'others' ? b.custom_category_label : cat?.label}</td>
                    <td className="p-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_BADGE[b.status])}>{b.status}</span>
                    </td>
                    <td className="p-3">{b.contract_signed ? '✅ Signed' : '—'}</td>
                    <td className="p-3">{formatCurrency(b.advance_paid)} / {formatCurrency(b.total_amount)}</td>
                    <td className="p-3">{formatCurrency(b.balance_due)}</td>
                    <td className="p-3">{b.final_payment_due_date ? format(new Date(b.final_payment_due_date), 'd MMM yyyy') : '—'}</td>
                    <td className="p-3">
                      {b.contact_phone && (
                        <a
                          href={whatsappLink(b.contact_phone, `Hi, following up on the ${cat?.label ?? ''} booking for Aditi & Jay's wedding.`)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald2-600 hover:text-emerald2-800"
                        >
                          <MessageCircle size={15} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-maroon-400">
                    No bookings match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <BookingModal
          booking={modal.booking}
          categories={categories}
          events={events}
          defaultCategoryKey={modal.categoryKey}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function StatTile({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent?: string }) {
  return (
    <div className="card p-5 flex flex-col justify-center">
      <Icon size={18} className={accent ?? 'text-gold-600'} />
      <div className="font-display text-2xl font-bold mt-2">{value}</div>
      <div className="text-xs text-maroon-400">{label}</div>
    </div>
  );
}
