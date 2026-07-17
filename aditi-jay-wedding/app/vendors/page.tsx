'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Vendor } from '@/lib/types';
import { formatCurrency, whatsappLink } from '@/lib/utils';
import { Plus, X, Star, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Photographer', 'Decorator', 'Catering', 'Makeup', 'Mehendi Artist', 'DJ', 'Venue', 'Flowers', 'Jeweler', 'Other'];

export default function VendorsPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Photographer', phone: '', advance_paid: 0, total_quote: 0, rating: 4, notes: '' });

  async function load() {
    const { data } = await supabase.from('vendors').select('*').order('name');
    setVendors((data as Vendor[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Vendor name required');
      return;
    }
    const { error } = await supabase.from('vendors').insert(form);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Vendor added');
    setCreating(false);
    setForm({ name: '', category: 'Photographer', phone: '', advance_paid: 0, total_quote: 0, rating: 4, notes: '' });
    load();
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl font-semibold">Vendors</h1>
        {isAdmin && (
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold">
            <Plus size={16} /> Add Vendor
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((v) => (
          <div key={v.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold">{v.name}</h3>
                <span className="text-xs text-gold-700 bg-gold-100 dark:bg-gold-900/40 dark:text-gold-300 px-2 py-0.5 rounded-full">{v.category}</span>
              </div>
              {v.rating != null && (
                <div className="flex items-center gap-1 text-xs text-gold-600">
                  <Star size={13} fill="currentColor" /> {v.rating}
                </div>
              )}
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-maroon-400">Total Quote</span><span>{formatCurrency(Number(v.total_quote))}</span></div>
              <div className="flex justify-between"><span className="text-maroon-400">Advance Paid</span><span>{formatCurrency(Number(v.advance_paid))}</span></div>
              <div className="flex justify-between font-medium"><span className="text-maroon-400">Balance</span><span>{formatCurrency(Number(v.balance))}</span></div>
            </div>
            {v.notes && <p className="text-xs text-maroon-400 mt-2">{v.notes}</p>}
            {v.phone && (
              <a href={whatsappLink(v.phone, `Hi ${v.name}, following up regarding Aditi & Jay's wedding.`)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald2-600 hover:text-emerald2-800">
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
          </div>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md card p-6 bg-ivory dark:bg-maroon-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Add Vendor</h2>
              <button onClick={() => setCreating(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Vendor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Total quote (₹)" value={form.total_quote} onChange={(e) => setForm({ ...form, total_quote: Number(e.target.value) })} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
                <input type="number" placeholder="Advance paid (₹)" value={form.advance_paid} onChange={(e) => setForm({ ...form, advance_paid: Number(e.target.value) })} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
              </div>
              <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 text-sm">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
