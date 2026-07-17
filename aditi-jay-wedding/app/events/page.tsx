'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { WeddingEvent, Task } from '@/lib/types';
import EventCard from '@/components/events/EventCard';
import { Plus, X, Archive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const COLOR_OPTIONS = ['mehendi', 'haldi', 'hasthmelap', 'gruhshanti', 'sangeet'];

export default function EventsPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [colorKey, setColorKey] = useState('mehendi');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');

  async function load() {
    const { data } = await supabase.from('events').select('*').order('sort_order');
    setEvents((data as WeddingEvent[]) ?? []);
    const { data: t } = await supabase.from('tasks').select('*');
    setTasks((t as Task[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventCompletion = (eventId: string) => {
    const evTasks = tasks.filter((t) => t.event_id === eventId);
    if (!evTasks.length) return 0;
    return Math.round((evTasks.filter((t) => t.status === 'Completed').length / evTasks.length) * 100);
  };

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Event name is required.');
      return;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { error } = await supabase.from('events').insert({
      name,
      slug: `${slug}-${Date.now().toString(36)}`,
      color_key: colorKey,
      event_date: eventDate || null,
      venue: venue || null,
      sort_order: events.length + 1,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Event created');
    setCreating(false);
    setName('');
    setVenue('');
    setEventDate('');
    load();
  }

  async function toggleArchive(ev: WeddingEvent) {
    await supabase.from('events').update({ is_archived: !ev.is_archived }).eq('id', ev.id);
    load();
  }

  async function deleteEvent(ev: WeddingEvent) {
    if (
      !confirm(
        `Permanently delete "${ev.name}"? Tasks, budget lines, and shopping items linked to it will be kept but unlinked from any event. This can't be undone.`
      )
    )
      return;
    const { error } = await supabase.from('events').delete().eq('id', ev.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Event deleted');
    load();
  }

  const visible = events.filter((e) => (showArchived ? true : !e.is_archived));

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Events</h1>
          <p className="text-sm text-maroon-400">Every ceremony, its own workspace.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived((s) => !s)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl card text-sm"
          >
            <Archive size={14} /> {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
          {isAdmin && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold"
            >
              <Plus size={16} /> New Event
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map((ev) => (
          <div key={ev.id} className="relative group">
            <EventCard event={ev} completion={eventCompletion(ev.id)} />
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleArchive(ev);
                  }}
                  title={ev.is_archived ? 'Unarchive' : 'Archive'}
                  className="bg-white/90 dark:bg-maroon-950/90 rounded-full p-1.5"
                >
                  <Archive size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    deleteEvent(ev);
                  }}
                  title="Delete permanently"
                  className="bg-white/90 dark:bg-maroon-950/90 rounded-full p-1.5 text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md card p-6 bg-ivory dark:bg-maroon-950">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">New Event</h2>
              <button onClick={() => setCreating(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Event name (e.g. Engagement)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
              />
              <select
                value={colorKey}
                onChange={(e) => setColorKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c} theme
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
              />
              <input
                placeholder="Venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 text-sm">
                Cancel
              </button>
              <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-maroon-gold text-white text-sm shadow-gold">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
