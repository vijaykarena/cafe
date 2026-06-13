'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_archived')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.is_archived) {
        await supabase.auth.signOut();
        throw new Error('Your account is archived. Please contact an administrator.');
      }

      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/pos');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen px-4 bg-zinc-950 text-zinc-50 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Cafe POS Login</h1>
          <p className="text-zinc-400 text-sm">Enter your credentials to access your session</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-400 rounded-lg bg-red-950/50 border border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cashier@cafe.com"
              className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-zinc-500 text-xs">
            Don't have an admin account?{' '}
            <Link href="/signup" className="text-amber-500 hover:underline">
              Create Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
