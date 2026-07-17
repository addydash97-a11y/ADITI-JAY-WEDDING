'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Task, TaskStatus, WeddingEvent } from '@/lib/types';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import TaskModal from '@/components/tasks/TaskModal';
import { Plus, LayoutGrid, Table as TableIcon, List, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn, URGENCY_COLORS, getUrgency } from '@/lib/utils';

type View = 'kanban' | 'table' | 'list' | 'calendar';

export default function TasksPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [view, setView] = useState<View>('kanban');
  const [modalTask, setModalTask] = useState<Task | null | undefined>(undefined);
  const [eventFilter, setEventFilter] = useState<string>('all');

  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
    setTasks((data as Task[]) ?? []);
  }

  useEffect(() => {
    loadTasks();
    supabase.from('events').select('*').eq('is_archived', false).order('sort_order').then(({ data }) => setEvents((data as WeddingEvent[]) ?? []));

    const channel = supabase
      .channel('tasks-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadTasks())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const completion = status === 'Completed' ? 100 : undefined;
    const { error } = await supabase
      .from('tasks')
      .update({ status, ...(completion !== undefined ? { completion } : {}) })
      .eq('id', taskId);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (status === 'Completed') {
      confetti({ particleCount: 100, spread: 70, colors: ['#7d2436', '#d99420', '#fdfaf4'] });
    }
    loadTasks();
  }

  const filtered = eventFilter === 'all' ? tasks : tasks.filter((t) => t.event_id === eventFilter);

  const VIEW_TABS: { key: View; label: string; icon: any }[] = [
    { key: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { key: 'table', label: 'Table', icon: TableIcon },
    { key: 'list', label: 'List', icon: List },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-maroon-400">{filtered.length} tasks · every ritual, tracked.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
          >
            <option value="all">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
          {isAdmin && (
            <button
              onClick={() => setModalTask(null)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold"
            >
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-white/60 dark:bg-maroon-900/40 rounded-full p-1 w-fit border border-gold-200/50 dark:border-gold-700/30">
        {VIEW_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition',
              view === key ? 'bg-maroon-gold text-white' : 'text-maroon-500'
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {view === 'kanban' && (
        <KanbanBoard tasks={filtered} onStatusChange={handleStatusChange} onTaskClick={setModalTask} />
      )}

      {view === 'table' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-maroon-400 border-b border-gold-200/50 dark:border-gold-700/30">
                <th className="p-3">Task</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Due</th>
                <th className="p-3">Completion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setModalTask(t)}
                  className="border-b border-gold-100/50 dark:border-gold-800/30 hover:bg-gold-50/50 dark:hover:bg-maroon-800/30 cursor-pointer"
                >
                  <td className="p-3 font-medium">{t.name}</td>
                  <td className="p-3">{t.priority}</td>
                  <td className="p-3">{t.status}</td>
                  <td className="p-3">{t.due_date ? format(new Date(t.due_date), 'd MMM yyyy') : '—'}</td>
                  <td className="p-3">{t.completion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-2">
          {filtered.map((t) => {
            const urgency = getUrgency(t.due_date);
            return (
              <div
                key={t.id}
                onClick={() => setModalTask(t)}
                className="card p-4 flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-maroon-400">{t.category ?? 'Uncategorized'} · {t.status}</div>
                </div>
                {t.due_date && (
                  <span className={cn('text-xs px-2 py-1 rounded-full border', URGENCY_COLORS[urgency])}>
                    {format(new Date(t.due_date), 'd MMM')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'calendar' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(
            filtered.reduce<Record<string, Task[]>>((acc, t) => {
              const key = t.due_date ? format(new Date(t.due_date), 'MMMM yyyy') : 'No due date';
              acc[key] = acc[key] ? [...acc[key], t] : [t];
              return acc;
            }, {})
          ).map(([month, monthTasks]) => (
            <div key={month} className="card p-4">
              <h3 className="font-display font-semibold mb-2">{month}</h3>
              <div className="space-y-1.5">
                {monthTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setModalTask(t)}
                    className="text-sm flex justify-between cursor-pointer hover:text-gold-600"
                  >
                    <span>{t.name}</span>
                    <span className="text-maroon-400">{t.due_date ? format(new Date(t.due_date), 'd') : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalTask !== undefined && (
        <TaskModal task={modalTask} events={events} onClose={() => setModalTask(undefined)} onSaved={loadTasks} />
      )}
    </div>
  );
}
