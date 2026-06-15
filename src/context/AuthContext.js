"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(authUser) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      let business = null;
      if (profile?.role === "business") {
        const { data: businessData } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        business = businessData || null;
      }

      const fallbackName = authUser.email?.split("@")[0] || "User";
      const name = profile?.name || business?.name || fallbackName;
      const avatarUrl =
        profile?.role === "business"
          ? business?.logo_url || profile?.avatar_url || null
          : profile?.avatar_url || null;

      setUser({
        id: authUser.id,
        email: authUser.email,
        name,
        role: profile?.role || "user",
        category: profile?.category || business?.category || null,
        business,
        avatar: name ? name.charAt(0).toUpperCase() : "U",
        avatarUrl,
        bio: profile?.bio || "",
      });
    } catch (err) {
      console.error("Eroare la aducerea profilului:", err);
      const fallbackName = authUser.email?.split("@")[0] || "User";
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: fallbackName,
        role: "user",
        category: null,
        business: null,
        avatar: fallbackName.charAt(0).toUpperCase(),
        avatarUrl: null,
        bio: "",
      });
    } finally {
      setLoading(false);
    }
  }

  const refreshUser = async () => {
    setLoading(true);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      await fetchUserProfile(authUser);
    } else {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
