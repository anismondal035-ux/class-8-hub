import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Trash2, LogIn } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({ meta: [{ title: "Notes — Class 8 B" }, { name: "description", content: "Shared class notes." }] }),
});

function NotesPage() {
  const { user, profile, signInWithGoogle } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [subject, setSubject] = useState(""); const [title, setTitle] = useState(""); const [content, setContent] = useState("");

  async function add() {
    if (!user) return signInWithGoogle();
    if (!subject.trim() || !title.trim() || !content.trim()) return toast.error("All fields needed");
    const { error } = await supabase.from("notes").insert({
      user_id: user.id, author_name: profile?.display_name || "Student",
      subject: subject.trim(), title: title.trim(), content: content.trim(),
    });
    if (error) return toast.error("Couldn't add");
    setSubject(""); setTitle(""); setContent("");
    qc.invalidateQueries({ queryKey: ["notes"] });
    qc.invalidateQueries({ queryKey: ["dash-notes"] });
    toast.success("Note added");
  }
  async function del(id: string) {
    await supabase.from("notes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notes"] });
    qc.invalidateQueries({ queryKey: ["dash-notes"] });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-4">
          <FileText className="w-3.5 h-3.5" /> Shared
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold">Class <span className="text-gradient">Notes</span></h1>
      </div>

      <div className="glass rounded-3xl p-5 mb-6 grid gap-3 sm:grid-cols-2">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the note here…" rows={5} className="sm:col-span-2" />
        <Button onClick={add} className="sm:col-span-2 bg-hero shadow-soft-glow">
          {!user ? <><LogIn className="w-4 h-4 mr-2" /> Sign in to add</> : <><Plus className="w-4 h-4 mr-2" /> Add Note</>}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {data.length === 0 && <div className="glass rounded-3xl p-10 text-center text-muted-foreground md:col-span-2">No notes yet.</div>}
        {data.map((n: any) => (
          <div key={n.id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-primary font-semibold uppercase">{n.subject}</p>
                <h3 className="font-bold mt-0.5">{n.title}</h3>
              </div>
              {user?.id === n.user_id && (
                <button onClick={() => del(n.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
            <p className="text-sm mt-3 whitespace-pre-wrap text-foreground/90">{n.content}</p>
            <p className="text-xs text-muted-foreground mt-3">by {n.author_name} · {new Date(n.created_at).toLocaleDateString("en-GB")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
