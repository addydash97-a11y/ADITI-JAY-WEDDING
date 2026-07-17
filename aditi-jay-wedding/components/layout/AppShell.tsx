'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth-context';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLogin) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
