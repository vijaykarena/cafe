"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const data = await fetchProfile(user.id);
    setProfile(data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    // 1. Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          document.cookie = `sb-access-token=${session.access_token || ""}; path=/; max-age=604800; SameSite=Lax`;
          const dbProfile = await fetchProfile(session.user.id);
          setProfile(dbProfile);
        }
      } catch (err) {
        console.error("Initial auth setup failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = currentUserRef.current;
      const newUser = session?.user || null;

      const hasChanged =
        (!currentUser && newUser) ||
        (currentUser && !newUser) ||
        (currentUser && newUser && currentUser.id !== newUser.id);

      if (!hasChanged) {
        if (session) {
          document.cookie = `sb-access-token=${session.access_token || ""}; path=/; max-age=604800; SameSite=Lax`;
        }
        return;
      }

      setLoading(true);
      if (session) {
        setUser(session.user);
        document.cookie = `sb-access-token=${session.access_token || ""}; path=/; max-age=604800; SameSite=Lax`;
        const dbProfile = await fetchProfile(session.user.id);
        setProfile(dbProfile);
      } else {
        setUser(null);
        setProfile(null);
        document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");

  return context;
}
