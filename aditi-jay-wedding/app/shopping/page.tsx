'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { ShoppingItem, WeddingEvent } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Clothes', 'Jewelry', 'Decorations', 'Flowers', 'Food', 'Return Gifts', 'Wedding Cards', 'Stage', 'Lighting', 'Other'];

export default function ShoppingPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'Clothes', quantity: 1, budget_amount: 0, store: '', event_id: '',
  });
  const [filter, setFilter] = useState('all');

  async function load() {
    const { data } = await supabase.from('shopping_items').select('*').order('created_at', { ascending: false });
    setItems((data as ShoppingItem[]) ?? []);
    const { data: ev } = await supabase.from('events').select('*').eq('is_archived', false);
    setEvents((ev as WeddingEvent[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function togglePurchased(item: ShoppingItem) {
    await supabase.from('shopping_items').update({ purchased: !item.purchased }).eq('id', item.id);
    load();
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Item name required');
      return;
    }
    const { error } = await supabase.from('shopping_items').insert({
      ...form,
      event_id: form.event_id || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Item added');
    setCreating(false);
    setForm({ name: '', category: 'Clothes', quantity: 1, budget_amount: 0, store: '', event_id: '' });
    load();
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);
  const totalBudget = filtered.reduce((s, i) => s + Number(i.budget_amount), 0);
  const totalActual = filtered.reduce((s, i) => s + Number(i.actual_amount ?? 0), 0);

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Shopping Planner</h1>
          <p className="text-sm text-maroon-400">
            {formatCurrency(totalActual)} spent of {formatCurrency(totalBudget)} budgeted
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold">
            <Plus size={16} /> Add Item
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-thin pb-1">
        <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-full text-xs whitespace-nowrap border', filter === 'all' ? 'bg-maroon-gold text-white border-transparent' : 'border-gold-200')}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={cn('px-3 py-1.5 rounded-full text-xs whitespace-nowrap border', filter === c ? 'bg-maroon-gold text-white border-transparent' : 'border-gold-200')}>
            {c}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-maroon-400 border-b border-gold-200/50 dark:border-gold-700/30">
              <th className="p-3">Item</th>
              <th className="p-3">Category</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Budget</th>
              <th className="p-3">Actual</th>
              <th className="p-3">Store</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-gold-100/50 dark:border-gold-800/30">
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{formatCurrency(Number(item.budget_amount))}</td>
                <td className="p-3">{item.actual_amount ? formatCurrency(Number(item.actual_amount)) : '—'}</td>
                <td className="p-3 text-maroon-400">{item.store ?? '—'}</td>
                <td className="p-3">
                  <button
                    onClick={() => togglePurchased(item)}
                    disabled={!isAdmin}
                    className={cn(
                      'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                      item.purchased ? 'bg-emerald2-100 text-emerald2-700' : 'bg-gold-100 text-gold-700'
                    )}
                  >
                    {item.purchased && <Check size={11} />}
                    {item.purchased ? 'Purchased' : 'Pending'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md card p-6 bg-ivory dark:bg-maroon-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">Add Shopping Item</h2>
              <button onClick={() => setCreating(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
                <option value="">No specific event</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
                <input type="number" placeholder="Budget (₹)" value={form.budget_amount} onChange={(e) => setForm({ ...form, budget_amount: Number(e.target.value) })} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
              </div>
              <input placeholder="Store" value={form.store} onChange={(e) => setForm({ ...form, store: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
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
