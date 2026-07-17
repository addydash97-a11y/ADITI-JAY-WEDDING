'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Guest } from '@/lib/types';
import { cn, whatsappLink } from '@/lib/utils';
import { Plus, X, MessageCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function GuestsPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState('all');
  const [rsvpFilter, setRsvpFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', group_type: 'Family', side: 'Both', food_preference: 'Veg', phone: '',
  });

  async function load() {
    const { data } = await supabase.from('guests').select('*').order('name');
    setGuests((data as Guest[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Guest name is required');
      return;
    }
    const { error } = await supabase.from('guests').insert(form);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Guest added');
    setCreating(false);
    setForm({ name: '', group_type: 'Family', side: 'Both', food_preference: 'Veg', phone: '' });
    load();
  }

  async function updateRsvp(g: Guest, status: Guest['rsvp_status']) {
    await supabase.from('guests').update({ rsvp_status: status }).eq('id', g.id);
    load();
  }

  const filtered = useMemo(
    () =>
      guests
        .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
        .filter((g) => sideFilter === 'all' || g.side === sideFilter)
        .filter((g) => rsvpFilter === 'all' || g.rsvp_status === rsvpFilter),
    [guests, search, sideFilter, rsvpFilter]
  );

  const RSVP_COLOR: Record<string, string> = {
    Confirmed: 'bg-emerald2-100 text-emerald2-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Declined: 'bg-red-100 text-red-700',
  };

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Guests</h1>
          <p className="text-sm text-maroon-400">{filtered.length} of {guests.length} guests</p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold">
            <Plus size={16} /> Add Guest
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white/70 dark:bg-maroon-900/50 border border-gold-200/50 dark:border-gold-700/30 rounded-full px-4 py-2">
          <Search size={14} className="text-maroon-400" />
          <input placeholder="Search guests..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent outline-none text-sm" />
        </div>
        <select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
          <option value="all">All sides</option>
          <option value="Bride">Bride side</option>
          <option value="Groom">Groom side</option>
          <option value="Both">Both</option>
        </select>
        <select value={rsvpFilter} onChange={(e) => setRsvpFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
          <option value="all">All RSVP</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Declined">Declined</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-maroon-400 border-b border-gold-200/50 dark:border-gold-700/30">
              <th className="p-3">Name</th>
              <th className="p-3">Group</th>
              <th className="p-3">Side</th>
              <th className="p-3">Food</th>
              <th className="p-3">Invitation</th>
              <th className="p-3">RSVP</th>
              <th className="p-3">Contact</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-b border-gold-100/50 dark:border-gold-800/30">
                <td className="p-3 font-medium">{g.name}</td>
                <td className="p-3">{g.group_type}</td>
                <td className="p-3">{g.side}</td>
                <td className="p-3">{g.food_preference}</td>
                <td className="p-3">{g.invitation_sent ? 'Sent' : 'Pending'}</td>
                <td className="p-3">
                  <select
                    disabled={!isAdmin}
                    value={g.rsvp_status}
                    onChange={(e) => updateRsvp(g, e.target.value as Guest['rsvp_status'])}
                    className={cn('text-xs px-2 py-1 rounded-full border-none', RSVP_COLOR[g.rsvp_status])}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Declined">Declined</option>
                  </select>
                </td>
                <td className="p-3">
                  {g.phone && (
                    <a href={whatsappLink(g.phone, `Hi ${g.name}, looking forward to celebrating with you at Aditi & Jay's wedding!`)} target="_blank" rel="noreferrer" className="text-emerald2-600 hover:text-emerald2-800">
                      <MessageCircle size={16} />
                    </a>
                  )}
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
              <h2 className="font-display text-xl font-semibold">Add Guest</h2>
              <button onClick={() => setCreating(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.group_type} onChange={(e) => setForm({ ...form, group_type: e.target.value })} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
                  <option>Family</option><option>Friends</option><option>VIP</option>
                </select>
                <select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })} className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
                  <option>Bride</option><option>Groom</option><option>Both</option>
                </select>
              </div>
              <select value={form.food_preference} onChange={(e) => setForm({ ...form, food_preference: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm">
                <option>Veg</option><option>Non-Veg</option><option>Jain</option><option>Vegan</option>
              </select>
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm" />
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
