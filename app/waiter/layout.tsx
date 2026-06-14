"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useRequireRoles } from "@/hooks/use-require-roles";
import { LogOut } from "lucide-react";

const ALLOWED_ROLES = ["waiter"];

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, loading } = useRequireRoles(ALLOWED_ROLES);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading || !profile || !ALLOWED_ROLES.includes(profile.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#F9F5F2] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-400 font-medium font-sans">
            Verifying Waiter privileges...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-900/40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg text-zinc-500 capitalize">
            {profile?.role}:
          </span>
          <span className="text-lg font-bold text-white leading-none">
            {profile?.name}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 flex items-center gap-2 bg-red-955/20 border border-red-900/30 hover:bg-red-900/30 text-red-400 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
