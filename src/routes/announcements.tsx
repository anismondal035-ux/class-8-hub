import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus, Trash2, LogIn, Pin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/announcements")({
  component: AnnouncementsPage,
  head: () => ({ meta: [{ title: "Announcements — Class 8 B" }, { name: "description", content: "Class 8 B announcements and notices." }] }),
});

function AnnouncementsPage() {
  const { user, profile, signInWithGoogle } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["ann"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [pinned, setPinned] = useState(false);

  async function add() {
    if (!user) return signInWithGoogle();
    if (!title.trim() || !body.trim()) return toast.error("Title & body needed");
    const { error } = await supabase.from("announcements").insert({
      user_id: user.id, author_name: profile?.display_name || "Student",
      title: title.trim(), body: body.trim(), pinned,
    });
    if (error) return toast.error("Couldn't add");
    setTitle(""); setBody(""); setPinned(false);
    qc.invalidateQueries({ queryKey: ["ann"] });
    qc.invalidateQueries({ queryKey: ["dash-ann"] });
    toast.success("Posted");
  }
  async function del(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["ann"] });
    qc.invalidateQueries({ queryKey: ["dash-ann"] });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-4">
          <Megaphone className="w-3.5 h-3.5" /> News
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold"><span className="text-gradient">Announcements</span></h1>
      </div>

      <div className="glass rounded-3xl p-5 mb-6 grid gap-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's the news?" rows={3} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to top
        </label>
        <Button onClick={add} className="bg-hero shadow-soft-glow">
          {!user ? <><LogIn className="w-4 h-4 mr-2" /> Sign in to post</> : <><Plus className="w-4 h-4 mr-2" /> Post</>}
        </Button>
      </div>

      <div className="space-y-3">
        {data.length === 0 && <div className="glass rounded-3xl p-10 text-center text-muted-foreground">No announcements yet.</div>}
        {data.map((a: any) => (
          <div key={a.id} className={`glass rounded-2xl p-5 ${a.pinned ? "border-primary/50 shadow-soft-glow" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold flex items-center gap-2">{a.pinned && <Pin className="w-4 h-4 text-primary" />}{a.title}</h3>
              {user?.id === a.user_id && (
                <button onClick={() => del(a.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
            <p className="text-sm mt-2 whitespace-pre-wrap text-foreground/90">{a.body}</p>
            <p className="text-xs text-muted-foreground mt-3">{a.author_name} · {new Date(a.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
