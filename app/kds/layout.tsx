"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function KdsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!profile || profile.is_archived) {
      signOut();
      router.push("/login");
      return;
    }

    if (
      profile.role !== "manager" &&
      profile.role !== "admin" &&
      profile.role !== "cook"
    ) {
      if (profile.role === "waiter") router.push("/waiter");
      else router.push("/cashier");
    }
  }, [profile, loading, router, signOut]);

  if (
    loading ||
    !profile ||
    (profile.role !== "manager" &&
      profile.role !== "admin" &&
      profile.role !== "cook")
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#F9F5F2] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-400 font-medium font-sans">
            Verifying KDS privileges...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {children}
    </div>
  );
}
