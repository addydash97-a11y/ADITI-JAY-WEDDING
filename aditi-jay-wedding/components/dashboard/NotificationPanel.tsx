'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatDistanceToNow } from 'date-fns';

interface Notif {
  id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setItems((data as Notif[]) ?? []));

    const channel = supabase
      .channel('notifications-panel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${profile.id}` },
        (payload) => setItems((prev) => [payload.new as Notif, ...prev])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  return (
    <div className="absolute right-0 mt-2 w-80 card p-3 z-40" onMouseLeave={onClose}>
      <div className="font-display text-sm font-semibold mb-2 px-1">Notifications</div>
      {items.length === 0 && (
        <div className="text-sm text-maroon-400 px-1 py-4 text-center">You&apos;re all caught up.</div>
      )}
      <div className="max-h-80 overflow-y-auto scrollbar-thin space-y-1">
        {items.map((n) => (
          <div key={n.id} className="p-2 rounded-lg hover:bg-gold-100/50 dark:hover:bg-maroon-800/40">
            <div className="text-sm font-medium">{n.title}</div>
            {n.body && <div className="text-xs text-maroon-400 line-clamp-2">{n.body}</div>}
            <div className="text-[11px] text-gold-600 mt-0.5">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
