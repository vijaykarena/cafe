'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
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

      setProfile(profile);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#F9F5F2] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-400 font-medium font-sans">Loading POS environment...</p>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">{children}</div>;
}
