"use client";

import React, { useState, useEffect } from "react";
import { Profile } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { Loader2 } from "lucide-react";

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<Profile[]>([]);
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/staff");
        const data = await res.json();
        // Filter only manager profiles
        const filtered = (data || []).filter(
          (p: Profile) => p.role === "manager",
        );
        setManagers(filtered);
      } catch (err) {
        console.error("Error fetching managers list:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggleArchive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_archived: !currentStatus }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setManagers(
        managers.map((p) =>
          p.id === id ? { ...p, is_archived: !currentStatus } : p,
        ),
      );
    } catch (err) {
      setManagers(
        managers.map((p) =>
          p.id === id ? { ...p, is_archived: !currentStatus } : p,
        ),
      );
    }
  };

  const handleToggleBan = async (id: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? "Unblock" : "Block";
    if (
      !confirm(
        `Are you sure you want to ${action} this manager profile? Blocked users cannot access the system.`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/staff`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_banned: !currentBanStatus }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setManagers(
        managers.map((p) =>
          p.id === id ? { ...p, is_banned: !currentBanStatus } : p,
        ),
      );
    } catch (err) {
      console.error(err);
      // Fallback state on error
      setManagers(
        managers.map((p) =>
          p.id === id ? { ...p, is_banned: currentBanStatus } : p,
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Managers Directory
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Configure and manage store manager accounts, archive credentials,
            and review statuses
          </p>
        </div>

        <button
          onClick={() => (window.location.href = "/admin/managers/create")}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
        >
          Create Manager Profile
        </button>
      </div>

      {/* Managers List Table */}
      <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-4">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-505">
          Active Managers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-855 text-zinc-505 font-semibold uppercase tracking-wider">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((mgr, idx) => (
                <tr
                  key={idx}
                  className="border-b border-zinc-855 text-zinc-350 hover:bg-zinc-855/10 transition-all"
                >
                  <td className="py-3 font-semibold text-white">{mgr.name}</td>
                  <td className="py-3 font-mono">{mgr.email}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${mgr.is_archived
                          ? "bg-zinc-500/10 border border-zinc-500/25 text-zinc-400"
                          : "bg-blue-500/10 border border-blue-500/25 text-blue-400"
                          }`}
                      >
                        {mgr.is_archived ? "Archived" : "Active"}
                      </span>
                      {mgr.is_banned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 border border-red-500/25 text-red-400">
                          Banned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() =>
                        handleToggleArchive(mgr.id, mgr.is_archived)
                      }
                      disabled={currentUser?.id === mgr.id}
                      className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {mgr.is_archived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      onClick={() => handleToggleBan(mgr.id, !!mgr.is_banned)}
                      disabled={currentUser?.id === mgr.id}
                      className={`px-2.5 py-1 rounded border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${mgr.is_banned
                        ? "bg-orange-950/20 hover:bg-orange-950/40 border-orange-900/30 text-orange-400"
                        : "bg-red-950/20 hover:bg-red-950/40 border-red-900/30 text-red-400"
                        }`}
                    >
                      {mgr.is_banned ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}

              {managers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-550">
                    No manager profiles configured.
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
