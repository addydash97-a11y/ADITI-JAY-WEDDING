'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { BOOKING_STATUSES, type VendorBooking, type BookingCategory, type WeddingEvent } from '@/lib/types';
import { X, Trash2, Plus, Upload, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingModal({
  booking,
  categories,
  events,
  defaultCategoryKey,
  onClose,
  onSaved,
}: {
  booking: VendorBooking | null;
  categories: BookingCategory[];
  events: WeddingEvent[];
  defaultCategoryKey?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const { isAdmin, profile } = useAuth();
  const [vendorName, setVendorName] = useState(booking?.vendor_name ?? '');
  const [categoryKey, setCategoryKey] = useState(booking?.category_key ?? defaultCategoryKey ?? categories[0]?.key ?? '');
  const [customCategory, setCustomCategory] = useState(booking?.custom_category_label ?? '');
  const [eventId, setEventId] = useState(booking?.event_id ?? '');
  const [status, setStatus] = useState(booking?.status ?? 'Not Booked');
  const [bookingDate, setBookingDate] = useState(booking?.booking_date ?? '');
  const [contractSigned, setContractSigned] = useState(booking?.contract_signed ?? false);
  const [advancePaid, setAdvancePaid] = useState(booking?.advance_paid ?? 0);
  const [totalAmount, setTotalAmount] = useState(booking?.total_amount ?? 0);
  const [finalDueDate, setFinalDueDate] = useState(booking?.final_payment_due_date ?? '');
  const [contactPerson, setContactPerson] = useState(booking?.contact_person ?? '');
  const [contactPhone, setContactPhone] = useState(booking?.contact_phone ?? '');
  const [trialDate, setTrialDate] = useState(
    booking?.trial_scheduled_date ? booking.trial_scheduled_date.slice(0, 16) : ''
  );
  const [fittingDates, setFittingDates] = useState<string[]>(booking?.fitting_dates ?? []);
  const [newFittingDate, setNewFittingDate] = useState('');
  const [notes, setNotes] = useState(booking?.notes ?? '');
  const [contractUrl, setContractUrl] = useState(booking?.contract_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isTrialCategory = ['makeup_artist', 'wedding_clothes', 'food_catering'].includes(categoryKey);
  const isFittingCategory = categoryKey === 'wedding_clothes';

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('contracts').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('contracts').getPublicUrl(path);
      setContractUrl(data.publicUrl);
      toast.success('Contract uploaded');
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!vendorName.trim()) {
      toast.error('Vendor name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        vendor_name: vendorName,
        category_key: categoryKey,
        custom_category_label: categoryKey === 'others' ? customCategory : null,
        event_id: eventId || null,
        status,
        booking_date: bookingDate || null,
        contract_signed: contractSigned,
        advance_paid: advancePaid,
        total_amount: totalAmount,
        final_payment_due_date: finalDueDate || null,
        contact_person: contactPerson || null,
        contact_phone: contactPhone || null,
        trial_scheduled_date: isTrialCategory && trialDate ? new Date(trialDate).toISOString() : null,
        fitting_dates: isFittingCategory ? fittingDates : [],
        notes: notes || null,
        contract_url: contractUrl || null,
        created_by: profile?.id ?? null,
      };

      if (booking) {
        const { error } = await supabase.from('vendor_bookings').update(payload).eq('id', booking.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vendor_bookings').insert(payload);
        if (error) throw error;
      }
      toast.success(booking ? 'Booking updated' : 'Booking added');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not save booking');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!booking) return;
    if (!confirm('Remove this booking record?')) return;
    const { error } = await supabase.from('vendor_bookings').delete().eq('id', booking.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Booking removed');
    onSaved();
    onClose();
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin card p-6 bg-ivory dark:bg-maroon-950">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">{booking ? 'Edit Booking' : 'New Booking'}</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Vendor / provider name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm font-medium col-span-2"
            />
            <select
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            >
              <option value="">Wedding-wide (all functions)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
            {categoryKey === 'others' && (
              <input
                placeholder="Custom category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm col-span-2"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            >
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              placeholder="Booking date"
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={contractSigned} onChange={(e) => setContractSigned(e.target.checked)} />
            Contract signed
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-maroon-400 mb-1 block">Total amount (₹)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-maroon-400 mb-1 block">Advance paid (₹)</label>
              <input
                type="number"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-maroon-400 mb-1 block">Final payment due date</label>
            <input
              type="date"
              value={finalDueDate}
              onChange={(e) => setFinalDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Contact person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            />
            <input
              placeholder="Contact phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            />
          </div>

          {isTrialCategory && (
            <div>
              <label className="text-xs text-maroon-400 mb-1 block">
                Trial / sample {categoryKey === 'food_catering' ? '(tasting)' : ''} scheduled
              </label>
              <input
                type="datetime-local"
                value={trialDate}
                onChange={(e) => setTrialDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
              />
            </div>
          )}

          {isFittingCategory && (
            <div>
              <label className="text-xs text-maroon-400 mb-1 block">Fitting dates</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {fittingDates.map((d, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs bg-gold-100 dark:bg-maroon-800 px-2 py-1 rounded-full">
                    {d}
                    <button onClick={() => setFittingDates((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newFittingDate}
                  onChange={(e) => setNewFittingDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
                />
                <button
                  onClick={() => {
                    if (newFittingDate) {
                      setFittingDates((prev) => [...prev, newFittingDate]);
                      setNewFittingDate('');
                    }
                  }}
                  className="px-3 rounded-lg bg-gold-100 dark:bg-maroon-800"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          <textarea
            placeholder="Notes"
            value={notes ?? ''}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
          />

          <div>
            <label className="text-xs text-maroon-400 mb-1 block">Contract upload</label>
            {contractUrl ? (
              <a
                href={contractUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-emerald2-600 hover:underline"
              >
                <FileCheck size={16} /> View uploaded contract
              </a>
            ) : (
              <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-dashed border-gold-300 dark:border-gold-700/40 cursor-pointer w-fit">
                <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload contract file'}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          {booking ? (
            <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">
              Remove booking
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 text-sm">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
