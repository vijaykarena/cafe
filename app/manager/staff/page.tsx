"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Profile } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncer } from "@/hooks/debounce";
import { Plus, Search, UserCheck } from "lucide-react";

export default function AdminStaffPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch, debouncedSearch] = useDebouncer("", 300);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  // Reset page to 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadData = async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/staff?page=${p}&limit=${pageSize}&search=${encodeURIComponent(s)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfiles(data.data || []);
      setTotalItems(data.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load staff list");
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
        `Are you sure you want to ${action} this staff record? Blocked users cannot access the system.`,
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

      toast.success(currentBanStatus ? "Staff unbanned" : "Staff banned");
      loadData(page, debouncedSearch);
    } catch (err: any) {
      toast.error(err.message || "Failed to update ban status");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Staff Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage terminal employee accounts, change passwords, and block
            access
          </p>
        </div>

        <Button
          onClick={() => (window.location.href = "/manager/staff/create")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Employee
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserCheck className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">
            {search ? "No staff match your search" : "No staff found"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search
              ? "Try adjusting your search term"
              : "Create your first employee to get started"}
          </p>
          {!search && (
            <Button
              onClick={() => (window.location.href = "/manager/staff/create")}
              className="mt-4"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Employee
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-zinc-950/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-48 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium text-white">
                    {profile.name}
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300">
                    {profile.email}
                  </TableCell>
                  <TableCell className="capitalize">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${profile.role === "admin"
                        ? "bg-purple-500/10 border border-purple-500/25 text-purple-400"
                        : "bg-blue-500/10 border border-blue-500/25 text-blue-400"
                        }`}
                    >
                      {profile.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${profile.is_banned
                          ? "bg-red-500/10 border border-red-500/25 text-red-400"
                          : "bg-blue-500/10 border border-blue-500/25 text-blue-400"
                          }`}
                      >
                        {profile.is_banned ? "Banned" : "Active"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <button
                      onClick={() =>
                        handleToggleBan(profile.id, !!profile.is_banned)
                      }
                      disabled={currentUser?.id === profile.id}
                      className={`px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${profile.is_banned
                        ? "bg-orange-950/20 hover:bg-orange-950/40 border-orange-900/30 text-orange-400"
                        : "bg-red-950/20 hover:bg-red-950/40 border-red-900/30 text-red-400"
                        }`}
                    >
                      {profile.is_banned ? "Unblock" : "Block"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
