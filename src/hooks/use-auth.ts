import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data as Profile);
      else setProfile({
        id: user.id,
        display_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Student",
        avatar_url: (user.user_metadata?.avatar_url as string) || null,
      });
    });
  }, [user]);

  async function signInWithGoogle() {
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) toast.error("Couldn't sign in. Try again.");
    } catch (e) {
      console.error(e); toast.error("Sign-in failed");
    }
  }
  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }

  return { session, user, profile, loading, signInWithGoogle, signOut };
}
