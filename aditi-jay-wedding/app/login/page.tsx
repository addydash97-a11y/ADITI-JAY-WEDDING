'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role: 'volunteer' } },
        });
        if (error) throw error;
        toast.success('Account created. Ask the admin to upgrade your role if needed.');
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-maroon-950 via-maroon-800 to-gold-700 p-4">
      <div className="w-full max-w-md card p-8 bg-white/95 dark:bg-maroon-900/95">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-maroon-gold flex items-center justify-center mb-3 shadow-gold">
            <Heart className="text-white" size={24} fill="white" />
          </div>
          <h1 className="font-display text-2xl font-semibold gradient-text">Aditi &amp; Jay</h1>
          <p className="text-sm text-maroon-400 mt-1">Wedding Planner · 02 Feb 2027</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input
              required
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent outline-none focus:border-gold-500"
            />
          )}
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent outline-none focus:border-gold-500"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full px-4 py-2.5 rounded-xl border border-gold-200 dark:border-gold-700/40 bg-transparent outline-none focus:border-gold-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-maroon-gold text-white font-medium shadow-gold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-maroon-500 hover:text-gold-600 w-full text-center"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? "New family member or volunteer? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
