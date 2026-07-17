'use client';

import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import NotificationPanel from '@/components/dashboard/NotificationPanel';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile } = useAuth();
  const [dark, setDark] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-8 py-4 border-b border-gold-200/50 dark:border-gold-700/30 bg-ivory/80 dark:bg-maroon-950/80 backdrop-blur">
      <button className="md:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <div className="hidden md:flex items-center gap-2 bg-white/70 dark:bg-maroon-900/50 border border-gold-200/50 dark:border-gold-700/30 rounded-full px-4 py-2 w-72">
        <Search size={16} className="text-maroon-400" />
        <input
          placeholder="Search tasks, guests, vendors..."
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-maroon-300"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gold-100/60 dark:hover:bg-maroon-800/60"
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="p-2 rounded-full hover:bg-gold-100/60 dark:hover:bg-maroon-800/60 relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-maroon-600" />
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>
        <div className="flex items-center gap-2 pl-2 border-l border-gold-200/50 dark:border-gold-700/30">
          <div className="w-8 h-8 rounded-full bg-gold-maroon flex items-center justify-center text-white text-xs font-semibold">
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="hidden sm:block text-sm">
            <div className="font-medium leading-tight">{profile?.full_name ?? 'Guest'}</div>
            <div className="text-xs text-maroon-400 capitalize leading-tight">{profile?.role}</div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gold-100/60 dark:hover:bg-maroon-800/60" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
