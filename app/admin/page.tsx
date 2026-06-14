"use client";

import React, { useState, useEffect } from "react";
import { Profile } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { Search, FolderOpen } from "lucide-react";
import { useDebouncer } from "@/hooks/debounce";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<Profile[]>([]);
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const [search, setSearch, debouncedSearch] = useDebouncer("", 300);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadData = async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff?role=manager&page=${p}&limit=${pageSize}&search=${encodeURIComponent(s)}`);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      setManagers(resData.data || []);
      setTotalItems(resData.total || 0);
    } catch (err) {
      console.error("Error fetching managers list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page, debouncedSearch);
  }, [page, debouncedSearch]);



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

  // We no longer return a full page loader

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Managers Directory
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Configure and manage store manager accounts and review statuses
          </p>
        </div>

        <button
          onClick={() => (window.location.href = "/admin/create")}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
        >
          Create Business
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Search managers by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Managers List Table */}
      {loading ? (
        <div className="space-y-3 mt-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg bg-zinc-900 border border-zinc-850" />
          ))}
        </div>
      ) : managers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-zinc-900 border border-zinc-850 mt-4">
          <FolderOpen className="w-12 h-12 text-zinc-600 mb-3" />
          <p className="text-zinc-400 font-medium">
            {search ? "No managers match your search" : "No managers found"}
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            {search
              ? "Try a different search term"
              : "Create your first manager to get started"}
          </p>
          {!search && (
            <button
              onClick={() => (window.location.href = "/admin/create")}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
            >
              Create Business
            </button>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-4 mt-4">
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
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${mgr.is_banned
                            ? "bg-red-500/10 border border-red-500/25 text-red-400"
                            : "bg-blue-500/10 border border-blue-500/25 text-blue-400"
                            }`}
                        >
                          {mgr.is_banned ? "Banned" : "Active"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right space-x-2">
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
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-zinc-855 mt-4">
            <Pagination
              currentPage={page}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
