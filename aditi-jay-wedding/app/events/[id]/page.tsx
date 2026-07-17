'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { WeddingEvent, Task, ShoppingItem, BudgetLine } from '@/lib/types';
import { EVENT_COLOR_MAP } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import ProgressRing from '@/components/dashboard/ProgressRing';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import TaskModal from '@/components/tasks/TaskModal';
import { Plus } from 'lucide-react';

const TABS = ['Overview', 'Tasks', 'Budget', 'Shopping', 'Notes'] as const;

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [budget, setBudget] = useState<BudgetLine[]>([]);
  const [notes, setNotes] = useState<{ id: string; body: string; created_at: string }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const { isAdmin } = useAuth();

  async function load() {
    const [{ data: ev }, { data: t }, { data: s }, { data: b }, { data: n }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('event_id', id),
      supabase.from('shopping_items').select('*').eq('event_id', id),
      supabase.from('budget_lines').select('*').eq('event_id', id),
      supabase.from('notes').select('*').eq('event_id', id).order('created_at', { ascending: false }),
    ]);
    setEvent(ev as WeddingEvent);
    setTasks((t as Task[]) ?? []);
    setShopping((s as ShoppingItem[]) ?? []);
    setBudget((b as BudgetLine[]) ?? []);
    setNotes(n ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addNote() {
    if (!newNote.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from('notes').insert({ event_id: id, author_id: user?.id, body: newNote });
    setNewNote('');
    load();
  }

  if (!event) return <div className="p-8 text-center text-maroon-400">Loading event...</div>;

  const colors = EVENT_COLOR_MAP[event.color_key] ?? EVENT_COLOR_MAP.mehendi;
  const completion = tasks.length
    ? Math.round((tasks.filter((t) => t.status === 'Completed').length / tasks.length) * 100)
    : 0;
  const plannedTotal = budget.reduce((s, b) => s + Number(b.planned_amount), 0);
  const actualTotal = budget.reduce((s, b) => s + Number(b.actual_amount), 0);

  return (
    <div className="animate-fade-up">
      <div
        className="rounded-2xl p-6 md:p-8 text-white mb-6"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{event.name}</h1>
            <p className="opacity-90 text-sm mt-1">
              {event.event_date ? format(new Date(event.event_date), 'EEEE, d MMMM yyyy') : 'Date TBD'}
              {event.venue ? ` · ${event.venue}` : ''}
            </p>
          </div>
          <ProgressRing percent={completion} size={90} stroke={9} label="Complete" />
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white/60 dark:bg-maroon-900/40 rounded-full p-1 w-fit border border-gold-200/50 dark:border-gold-700/30 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition',
              tab === t ? 'bg-maroon-gold text-white' : 'text-maroon-500'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-xs text-maroon-400">Tasks</div>
            <div className="font-display text-2xl font-bold">{tasks.length}</div>
            <div className="text-xs text-emerald2-600 mt-1">{tasks.filter((t) => t.status === 'Completed').length} completed</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-maroon-400">Budget</div>
            <div className="font-display text-2xl font-bold">{formatCurrency(actualTotal)}</div>
            <div className="text-xs text-maroon-400 mt-1">of {formatCurrency(plannedTotal)} planned</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-maroon-400">Shopping</div>
            <div className="font-display text-2xl font-bold">
              {shopping.filter((s) => s.purchased).length}/{shopping.length}
            </div>
            <div className="text-xs text-maroon-400 mt-1">items purchased</div>
          </div>
        </div>
      )}

      {tab === 'Tasks' && (
        <div className="space-y-2">
          {isAdmin && (
            <button
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold mb-2"
            >
              <Plus size={16} /> Add Task to {event.name}
            </button>
          )}
          {tasks.length === 0 && <p className="text-sm text-maroon-400">No tasks yet for this event.</p>}
          {tasks.map((t) => (
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-maroon-400">{t.status} · {t.priority} priority</div>
              </div>
              <span className="text-sm text-maroon-400">{t.completion}%</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'Budget' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-maroon-400 border-b border-gold-200/50 dark:border-gold-700/30">
                <th className="p-3">Category</th>
                <th className="p-3">Planned</th>
                <th className="p-3">Actual</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {budget.map((b) => (
                <tr key={b.id} className="border-b border-gold-100/50 dark:border-gold-800/30">
                  <td className="p-3">{b.category}</td>
                  <td className="p-3">{formatCurrency(Number(b.planned_amount))}</td>
                  <td className="p-3">{formatCurrency(Number(b.actual_amount))}</td>
                  <td className="p-3 text-maroon-400">{b.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Shopping' && (
        <div className="space-y-2">
          {shopping.map((s) => (
            <div key={s.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-maroon-400">{s.category} · Qty {s.quantity}</div>
              </div>
              <span className={cn('text-xs px-2 py-1 rounded-full', s.purchased ? 'bg-emerald2-100 text-emerald2-700' : 'bg-gold-100 text-gold-700')}>
                {s.purchased ? 'Purchased' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}

      {taskModalOpen && (
        <TaskModal
          task={null}
          events={[event]}
          onClose={() => setTaskModalOpen(false)}
          onSaved={load}
        />
      )}

      {tab === 'Notes' && (
        <div className="card p-5">
          <div className="flex gap-2 mb-4">
            <input
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              className="flex-1 px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            />
            <button onClick={addNote} className="px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm">
              Add
            </button>
          </div>
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="text-sm bg-gold-50 dark:bg-maroon-800/40 rounded-xl px-4 py-2.5">
                {n.body}
                <div className="text-[11px] text-maroon-300 mt-1">{format(new Date(n.created_at), 'd MMM yyyy, h:mm a')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
