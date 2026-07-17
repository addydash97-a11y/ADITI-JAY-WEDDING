import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInCalendarDays, isPast, isToday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WEDDING_DATE = new Date('2027-02-02T00:00:00');
// Planning is assumed to start from the app's first deployment; adjust as needed.
export const PLANNING_START_DATE = new Date('2025-06-01T00:00:00');

export function getCountdown(target: Date = WEDDING_DATE) {
  const now = new Date();
  const totalMs = target.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(totalMs / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((totalMs / (1000 * 60 * 60)) % 24));
  const minutes = Math.max(0, Math.floor((totalMs / (1000 * 60)) % 60));
  const seconds = Math.max(0, Math.floor((totalMs / 1000) % 60));
  const weeks = Math.floor(days / 7);
  return { days, weeks, hours, minutes, seconds };
}

export function getPlanningElapsedPct(
  start: Date = PLANNING_START_DATE,
  end: Date = WEDDING_DATE
) {
  const now = new Date();
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export type UrgencyLevel = 'critical' | 'urgent' | 'upcoming' | 'can-wait' | 'none';

export function getUrgency(dueDate: string | null): UrgencyLevel {
  if (!dueDate) return 'none';
  const d = new Date(dueDate);
  if (isPast(d) && !isToday(d)) return 'critical';
  const daysLeft = differenceInCalendarDays(d, new Date());
  if (daysLeft <= 2) return 'urgent';
  if (daysLeft <= 7) return 'upcoming';
  return 'can-wait';
}

export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  critical: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300',
  urgent: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
  upcoming: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300',
  'can-wait': 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300',
  none: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Booking urgency compares "days remaining until the wedding" against the
 * category's ideal lead time. If a vendor in that category is still unbooked
 * and we're already inside (or past) the lead-time window, it's urgent/overdue.
 *   Red (overdue): 0 days or fewer left inside the lead-time window (i.e. we
 *     should already have booked this).
 *   Orange (urgent): within the last 25% of the lead-time window.
 *   Yellow (upcoming): within the last 50% of the lead-time window.
 *   Green (can wait): still outside the lead-time window — plenty of time.
 */
export type BookingUrgency = 'overdue' | 'urgent' | 'upcoming' | 'on-track' | 'done';

export function getBookingUrgency(
  status: string,
  leadDays: number,
  target: Date = WEDDING_DATE
): BookingUrgency {
  if (status !== 'Not Booked' && status !== 'Enquired' && status !== 'Negotiating') {
    return 'done';
  }
  const now = new Date();
  const daysUntilWedding = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilIdealBookBy = daysUntilWedding - leadDays; // negative = past the ideal date already

  if (daysUntilIdealBookBy <= 0) return 'overdue';
  if (daysUntilIdealBookBy <= leadDays * 0.25) return 'urgent';
  if (daysUntilIdealBookBy <= leadDays * 0.5) return 'upcoming';
  return 'on-track';
}

export const BOOKING_URGENCY_COLORS: Record<BookingUrgency, string> = {
  overdue: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300',
  urgent: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
  upcoming: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300',
  'on-track': 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300',
  done: 'bg-emerald2-100 text-emerald2-700 border-emerald2-300 dark:bg-emerald2-950 dark:text-emerald2-300',
};

export const BOOKING_URGENCY_LABELS: Record<BookingUrgency, string> = {
  overdue: 'Overdue',
  urgent: 'Urgent',
  upcoming: 'Book Soon',
  'on-track': 'On Track',
  done: 'Booked',
};

export function idealBookByDate(leadDays: number, target: Date = WEDDING_DATE) {
  return new Date(target.getTime() - leadDays * 24 * 60 * 60 * 1000);
}

export function whatsappLink(phone: string | null, message: string) {
  if (!phone) return '#';
  const cleaned = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}
