'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session } from '@/lib/types';

export default function WaiterDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionData();
  }, []);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      
      if (data.active) {
        setSession(data.session);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax';
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen p-6 bg-zinc-950 text-zinc-100 font-sans">
      <header className="absolute top-6 right-6 flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-950/40 border border-red-900/50 hover:bg-red-900/40 text-red-400 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </header>

      <div className="w-full max-w-xl p-8 space-y-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Waiter Dashboard</h1>
          <p className="text-zinc-400 text-sm">Table Management & Ordering</p>
        </div>

        {session ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400 font-semibold">Store is currently open</p>
              <p className="text-xs text-zinc-400 mt-1">You can take table orders now.</p>
            </div>

            <button
              onClick={() => router.push('/waiter/terminal')}
              className="w-full py-4 text-center text-sm font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-black transition-colors cursor-pointer shadow-lg hover:shadow-amber-500/20"
            >
              Enter Ordering Terminal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="p-8 rounded-xl bg-zinc-950 border border-red-900/50 space-y-2">
                <p className="text-red-400 font-semibold text-lg">Store is Closed</p>
                <p className="text-sm text-zinc-400">Waiting for a Manager or Cashier to open the register session for today.</p>
             </div>
             
             <button
              onClick={fetchSessionData}
              className="w-full py-3 text-center text-sm font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
            >
              Refresh Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
