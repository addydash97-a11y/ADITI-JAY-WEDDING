'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { BudgetLine, WeddingEvent, Vendor } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BudgetPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ category: '', planned_amount: 0, actual_amount: 0, event_id: '', vendor_id: '', notes: '' });

  async function load() {
    const [{ data: b }, { data: e }, { data: v }] = await Promise.all([
      supabase.from('budget_lines').select('*'),
      supabase.from('events').select('*').eq('is_archived', false),
      supabase.from('vendors').select('*'),
    ]);
    setLines((b as BudgetLine[]) ?? []);
    setEvents((e as WeddingEvent[]) ?? []);
    setVendors((v as Vendor[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    if (!form.category.trim()) {
      toast.error('Category required');
      return;
    }
    const { error } = await supabase.from('budget_lines').insert({
      ...form,
      event_id: form.event_id || null,
      vendor_id: form.vendor_id || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Budget line added');
    setCreating(false);
    setForm({ category: '', planned_amount: 0, actual_amount: 0, event_id: '', vendor_id: '', notes: '' });
    load();
  }

  const totalPlanned = lines.reduce((s, l) => s + Number(l.planned_amount), 0);
  const totalActual = lines.reduce((s, l) => s + Number(l.actual_amount), 0);
  const remaining = totalPlanned - totalActual;

  const chartData = Object.values(
    lines.reduce<Record<string, { category: string; planned: number; actual: number }>>((acc, l) => {
      acc[l.category] = acc[l.category] ?? { category: l.category, planned: 0, actual: 0 };
      acc[l.category].planned += Number(l.planned_amount);
      acc[l.category].actual += Number(l.actual_amount);
      return acc;
    }, {})
  );

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl font-semibold">Budget</h1>
        {isAdmin && (
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold">
            <Plus size={16} /> Add Budget Line
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs text-maroon-400">Total Planned</div>
          <div className="font-display text-2xl font-bold">{formatCurrency(totalPlanned)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-maroon-400">Total Spent</div>
          <div className="font-display text-2xl font-bold">{formatCurrency(totalActual)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-maroon-400">Remaining</div>
          <div className="font-display text-2xl font-bold" style={{ color: remaining < 0 ? '#dc2626' : undefined }}>
            {formatCurrency(remaining)}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6" style={{ height: 300 }}>
        <h3 className="font-display font-semibold mb-2 text-sm">Planned vs. Actual by Category</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="planned" fill="#d99420" radius={[6, 6, 0, 0]} />
            <Bar dataKey="actual" fill="#7d2436" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-maroon-400 border-b border-gold-200/50 dark:border-gold-700/30">
              <th className="p-3">Category</th>
              <th className="p-3">Planned</th>
              <th className="p-3">Actual</th>
              <th className="p-3">Vendor</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-gold-100/50 dark:border-gold-800/30">
                <td className="p-3 font-medium">{l.category}</td>
                <td className="p-3">{formatCurrency(Number(l.planned_amount))}</td>
                <td className="p-3">{formatCurrency(Number(l.actual_amount))}</td>
                <td className="p-3 text-maroon-400">{vendors.find((v) => v.id === l.vendor_id)?.name ?? '—'}</td>
                <td className="p-3 text-maroon-400">{l.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md card p-6 bg-ivory dark:bg-maroon-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Add Budget Line</h2>
              <button onClick={() => setCreating(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Category (e.g. Catering)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
              <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
                <option value="">No specific event</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
              <select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
                <option value="">No vendor</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Planned (₹)" value={form.planned_amount} onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
                <input type="number" placeholder="Actual (₹)" value={form.actual_amount} onChange={(e) => setForm({ ...form, actual_amount: Number(e.target.value) })} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
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
