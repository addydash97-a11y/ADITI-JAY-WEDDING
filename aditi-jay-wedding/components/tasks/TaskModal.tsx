'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { PRIORITIES, TASK_STATUSES, type Task, type Profile, type WeddingEvent } from '@/lib/types';
import { X, Plus, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TaskModal({
  task,
  events,
  onClose,
  onSaved,
}: {
  task: Task | null; // null = creating new
  events: WeddingEvent[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const { isAdmin, profile } = useAuth();
  const [name, setName] = useState(task?.name ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [category, setCategory] = useState(task?.category ?? '');
  const [eventId, setEventId] = useState(task?.event_id ?? events[0]?.id ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 'Medium');
  const [status, setStatus] = useState(task?.status ?? 'Not Started');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [completion, setCompletion] = useState(task?.completion ?? 0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<{ id?: string; label: string; is_done: boolean }[]>([]);
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [comments, setComments] = useState<{ id: string; body: string; created_at: string; profile_id: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => setProfiles((data as Profile[]) ?? []));
    if (task) {
      supabase
        .from('task_assignees')
        .select('profile_id')
        .eq('task_id', task.id)
        .then(({ data }) => setAssignedIds((data ?? []).map((d: any) => d.profile_id)));
      supabase
        .from('checklist_items')
        .select('*')
        .eq('task_id', task.id)
        .order('sort_order')
        .then(({ data }) => setChecklist(data ?? []));
      supabase
        .from('comments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at')
        .then(({ data }) => setComments(data ?? []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Task name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        category,
        event_id: eventId || null,
        priority,
        status,
        due_date: dueDate || null,
        completion,
        created_by: profile?.id ?? null,
      };

      let taskId = task?.id;
      if (task) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', task.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('tasks').insert(payload).select().single();
        if (error) throw error;
        taskId = data.id;
      }

      if (taskId) {
        await supabase.from('task_assignees').delete().eq('task_id', taskId);
        if (assignedIds.length > 0) {
          await supabase
            .from('task_assignees')
            .insert(assignedIds.map((profile_id) => ({ task_id: taskId, profile_id })));
        }

        for (const item of checklist) {
          if (item.id) {
            await supabase
              .from('checklist_items')
              .update({ label: item.label, is_done: item.is_done })
              .eq('id', item.id);
          } else {
            await supabase.from('checklist_items').insert({
              task_id: taskId,
              label: item.label,
              is_done: item.is_done,
            });
          }
        }
      }

      toast.success(task ? 'Task updated' : 'Task created');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not save task');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm('Delete this task permanently?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Task deleted');
    onSaved();
    onClose();
  }

  async function handleAddComment() {
    if (!task || !newComment.trim() || !profile) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: task.id, profile_id: profile.id, body: newComment })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setComments((prev) => [...prev, data]);
    setNewComment('');
  }

  const canEdit = isAdmin || (task ? assignedIds.includes(profile?.id ?? '') : true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin card p-6 bg-ivory dark:bg-maroon-950">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            disabled={!canEdit}
            placeholder="Task name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent outline-none focus:border-gold-500 font-medium"
          />
          <textarea
            disabled={!canEdit}
            placeholder="Description"
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent outline-none focus:border-gold-500 text-sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              disabled={!isAdmin}
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
            <input
              disabled={!isAdmin}
              placeholder="Category"
              value={category ?? ''}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            />
            <select
              disabled={!canEdit}
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} priority
                </option>
              ))}
            </select>
            <select
              disabled={!canEdit}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              disabled={!canEdit}
              type="date"
              value={dueDate ?? ''}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                disabled={!canEdit}
                type="range"
                min={0}
                max={100}
                value={completion}
                onChange={(e) => setCompletion(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-10">{completion}%</span>
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="text-xs text-maroon-400 mb-1 block">Assigned to</label>
              <div className="flex flex-wrap gap-2">
                {profiles.map((p) => {
                  const active = assignedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setAssignedIds((prev) =>
                          active ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        )
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        active
                          ? 'bg-maroon-gold text-white border-transparent'
                          : 'border-gold-200 dark:border-gold-700/40 text-maroon-500'
                      }`}
                    >
                      {p.full_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-maroon-400 mb-1 block">Checklist</label>
            <div className="space-y-1.5">
              {checklist.map((item, idx) => (
                <div key={item.id ?? idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.is_done}
                    onChange={(e) =>
                      setChecklist((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, is_done: e.target.checked } : c))
                      )
                    }
                  />
                  <span className={`text-sm flex-1 ${item.is_done ? 'line-through text-maroon-300' : ''}`}>
                    {item.label}
                  </span>
                  <button onClick={() => setChecklist((prev) => prev.filter((_, i) => i !== idx))}>
                    <Trash2 size={14} className="text-maroon-300 hover:text-red-500" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-1">
                <input
                  placeholder="Add checklist item"
                  value={newChecklistLabel}
                  onChange={(e) => setNewChecklistLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newChecklistLabel.trim()) {
                      setChecklist((prev) => [...prev, { label: newChecklistLabel, is_done: false }]);
                      setNewChecklistLabel('');
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
                />
                <button
                  onClick={() => {
                    if (newChecklistLabel.trim()) {
                      setChecklist((prev) => [...prev, { label: newChecklistLabel, is_done: false }]);
                      setNewChecklistLabel('');
                    }
                  }}
                  className="px-3 rounded-lg bg-gold-100 dark:bg-maroon-800"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {task && (
            <div>
              <label className="text-xs text-maroon-400 mb-1 flex items-center gap-1">
                <MessageSquare size={12} /> Comments
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin mb-2">
                {comments.map((c) => (
                  <div key={c.id} className="text-sm bg-gold-50 dark:bg-maroon-800/40 rounded-lg px-3 py-1.5">
                    {c.body}
                    <div className="text-[10px] text-maroon-300">{format(new Date(c.created_at), 'd MMM, h:mm a')}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gold-200 dark:border-gold-700/40 bg-transparent text-sm"
                />
                <button onClick={handleAddComment} className="px-3 rounded-lg bg-gold-100 dark:bg-maroon-800">
                  Post
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          {task && isAdmin ? (
            <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">
              Delete task
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
              disabled={saving || !canEdit}
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
