'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { Toaster } from '@/components/ui/sonner';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const checkManagerAuth = async () => {
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

      if (profile.role !== 'admin' && profile.role !== 'manager') {
        // Redirect non-managers to cashier or appropriate default
        if (profile.role === 'cook') router.push('/kds');
        else if (profile.role === 'waiter') router.push('/waiter');
        else router.push('/cashier');
        return;
      }

      setProfile(profile);
      setLoading(false);
    };

    checkManagerAuth();
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
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-400 font-medium font-sans">Verifying Manager privileges...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/manager' },
    { name: 'Categories', path: '/manager/categories' },
    { name: 'Products', path: '/manager/products' },
    { name: 'Floor & Tables', path: '/manager/tables' },
    { name: 'Promotions & Coupons', path: '/manager/promos' },
    { name: 'Staff Management', path: '/manager/staff' },
    { name: 'Payment Settings', path: '/manager/settings' },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-900/50 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
            <span className="text-lg font-bold tracking-tight text-white">Cafe POS Manager</span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-black'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-zinc-900 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-amber-500 text-xs">
              MGR
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{profile?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{profile?.email}</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/cashier')}
            className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Launch POS Cashier
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-950/20 border border-red-900/30 hover:bg-red-900/30 text-red-400 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
