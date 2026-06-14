import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function useRequireRoles(allowedRoles: string[]) {
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      signOut();
      router.push("/login");
      return;
    }

    if (!allowedRoles.includes(profile.role)) {
      router.push("/login");
    }
  }, [profile, loading, router, signOut, allowedRoles]);

  return { profile, loading };
}
