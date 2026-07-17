'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarHeart,
  ListChecks,
  ShoppingBag,
  Wallet,
  Users,
  Building2,
  X,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: CalendarHeart },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/bookings', label: 'Bookings', icon: ClipboardCheck },
  { href: '/shopping', label: 'Shopping', icon: ShoppingBag },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/guests', label: 'Guests', icon: Users },
  { href: '/vendors', label: 'Vendors', icon: Building2 },
];

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-6">
        <Sparkles className="text-gold-500" size={22} />
        <span className="font-display text-lg font-semibold gradient-text">Aditi &amp; Jay</span>
        <button className="ml-auto md:hidden" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-maroon-gold text-white shadow-gold'
                  : 'text-maroon-700 dark:text-ivory/80 hover:bg-gold-100/60 dark:hover:bg-maroon-800/60'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-maroon-400 dark:text-gold-200/60 border-t border-gold-200/40 dark:border-gold-700/30">
        02 Feb 2027 · With love, always
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex md:w-64 border-r border-gold-200/50 dark:border-gold-700/30 bg-white/70 dark:bg-maroon-950/60 backdrop-blur sticky top-0 h-screen">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-ivory dark:bg-maroon-950 shadow-2xl animate-fade-up">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
