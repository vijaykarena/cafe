'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';

export default function WaiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const checkWaiterAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile || profile.is_archived) {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      if (profile.role !== 'admin' && profile.role !== 'manager' && profile.role !== 'waiter') {
        if (profile.role === 'cook') router.push('/kds');
        else router.push('/cashier');
        return;
      }

      setProfile(profile);
      setLoading(false);
    };

    checkWaiterAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax';
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#F9F5F2] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-400 font-medium font-sans">Verifying Waiter privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-900/40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-[#F9F5F2] rounded-full"></span>
          <span className="text-base font-bold tracking-tight text-white">Cafe POS - Waiter Mode</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-white leading-none">{profile?.name}</p>
            <p className="text-[10px] text-zinc-500 mt-1 capitalize">{profile?.role}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-955/20 border border-red-900/30 hover:bg-red-900/30 text-red-400 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
