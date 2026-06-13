'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PosDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [openingBalance, setOpeningBalance] = useState('100.00');
  const [closingBalance, setClosingBalance] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionData();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }
    } catch (err) {
      console.error('Error fetching role in cashier page:', err);
    }
  };

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      
      if (data.active) {
        setSession(data.session);
      } else {
        setSession(null);
        setLastSession(data.lastSession);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opened_by: user.id,
          opening_balance: parseFloat(openingBalance),
        }),
      });

      const newSession = await res.json();
      if (newSession.error) throw new Error(newSession.error);

      setSession(newSession);
      router.push('/cashier/terminal');
    } catch (err: any) {
      alert(`Failed to open session: ${err.message}`);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      const balance = parseFloat(closingBalance) || 0;
      const res = await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          closing_balance: balance,
        }),
      });

      const updated = await res.json();
      if (updated.error) throw new Error(updated.error);

      await fetchSessionData();
      setClosingBalance('');
    } catch (err: any) {
      alert(`Failed to close session: ${err.message}`);
      console.error(err);
    } finally {
      setActionLoading(false);
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
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen p-6 bg-zinc-950 text-zinc-100 font-sans relative">
      <header className="absolute top-6 right-6 flex items-center gap-4">
        {(userRole === 'admin' || userRole === 'manager') && (
          <button
            onClick={() => router.push(userRole === 'admin' ? '/admin' : '/manager')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
          >
            Backend Dashboard
          </button>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-955/20 border border-red-900/30 hover:bg-red-900/30 text-red-400 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </header>

      <div className="w-full max-w-xl p-8 space-y-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Cafe POS Session</h1>
          <p className="text-zinc-400 text-sm">Control cashier registers and cash logs</p>
        </div>

        {session ? (
          // ACTIVE SESSION VIEW
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 animate-pulse mb-2">
                Active Session
              </span>
              <p className="text-sm text-zinc-300">
                Opened at: <span className="font-semibold">{formatDate(session.opened_at)}</span>
              </p>
              <p className="text-sm text-zinc-300 mt-1">
                Opening Balance:{' '}
                <span className="font-semibold text-white">
                  {formatCurrency(session.opening_balance)}
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/cashier/terminal')}
                className="flex-1 py-3 text-center text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-black transition-colors cursor-pointer"
              >
                Resume Session
              </button>
              <button
                onClick={() => {
                  const balance = prompt('Enter closing balance summary:');
                  if (balance !== null) {
                    setClosingBalance(balance);
                    setTimeout(() => handleCloseSession(), 100);
                  }
                }}
                disabled={actionLoading}
                className="flex-1 py-3 text-center text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                {actionLoading ? 'Closing...' : 'Close Session'}
              </button>
            </div>
          </div>
        ) : (
          // NO ACTIVE SESSION VIEW
          <div className="space-y-6">
            {lastSession && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-sm text-zinc-400">
                <p className="text-zinc-300 font-semibold mb-2">Last Session Summary:</p>
                <p>Closed at: {lastSession.closed_at ? formatDate(lastSession.closed_at) : 'N/A'}</p>
                <p>Opening Balance: {formatCurrency(lastSession.opening_balance)}</p>
                <p>Closing Balance: {lastSession.closing_balance ? formatCurrency(lastSession.closing_balance) : '$0.00'}</p>
              </div>
            )}

            <form onSubmit={handleOpenSession} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Opening Cash Balance ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Opening Register...' : 'Open Session / Start Shift'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
