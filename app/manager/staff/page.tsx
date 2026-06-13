'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function AdminStaffPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };



  const handleToggleArchive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_archived: !currentStatus }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setProfiles(profiles.map(p => p.id === id ? { ...p, is_archived: !currentStatus } : p));
    } catch (err) {
      setProfiles(profiles.map(p => p.id === id ? { ...p, is_archived: !currentStatus } : p));
    }
  };

  const handleToggleBan = async (id: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this staff record? Banned users cannot access the system.`)) return;
    try {
      const res = await fetch(`/api/staff`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_banned: !currentBanStatus }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setProfiles(profiles.map(p => p.id === id ? { ...p, is_banned: !currentBanStatus } : p));
    } catch (err) {
      console.error(err);
      // Fallback state
      setProfiles(profiles.map(p => p.id === id ? { ...p, is_banned: currentBanStatus } : p));
    }
  };



  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Staff Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage terminal employee accounts, change passwords, and archive credentials</p>
        </div>

        <button
          onClick={() => window.location.href = '/manager/staff/create'}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
        >
          Create Employee
        </button>
      </div>

      {/* Staff List Table */}
      <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-4">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">Employee Registers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-855 text-zinc-505 font-semibold uppercase tracking-wider">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile, idx) => (
                <tr key={idx} className="border-b border-zinc-855 text-zinc-350 hover:bg-zinc-850/10 transition-all">
                  <td className="py-3 font-semibold text-white">{profile.name}</td>
                  <td className="py-3 font-mono">{profile.email}</td>
                  <td className="py-3 capitalize">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      profile.role === 'admin' 
                        ? 'bg-purple-500/10 border border-purple-500/25 text-purple-400' 
                        : 'bg-blue-500/10 border border-blue-500/25 text-blue-400'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        profile.is_archived
                          ? 'bg-zinc-500/10 border border-zinc-500/25 text-zinc-400'
                          : 'bg-blue-500/10 border border-blue-500/25 text-blue-400'
                      }`}>
                        {profile.is_archived ? 'Archived' : 'Active'}
                      </span>
                      {profile.is_banned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 border border-red-500/25 text-red-400">
                          Banned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleArchive(profile.id, profile.is_archived)}
                      disabled={currentUser?.id === profile.id}
                      className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {profile.is_archived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={() => handleToggleBan(profile.id, !!profile.is_banned)}
                      disabled={currentUser?.id === profile.id}
                      className={`px-2.5 py-1 rounded border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        profile.is_banned
                          ? 'bg-orange-950/20 hover:bg-orange-950/40 border-orange-900/30 text-orange-400'
                          : 'bg-red-950/20 hover:bg-red-950/40 border-red-900/30 text-red-400'
                      }`}
                    >
                      {profile.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}

              {profiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-550">
                    No employee profiles configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
