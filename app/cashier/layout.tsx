"use client";

import { useRequireRoles } from "@/hooks/use-require-roles";

const ALLOWED_ROLES = ["cashier"];

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useRequireRoles(ALLOWED_ROLES);

  if (loading || !profile || !ALLOWED_ROLES.includes(profile.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#F9F5F2] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-400 font-medium font-sans">
            Verifying POS privileges...
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
