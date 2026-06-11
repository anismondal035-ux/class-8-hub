import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Plus, Trash2, LogIn } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/homework")({
  component: HomeworkPage,
  head: () => ({ meta: [{ title: "Homework — Class 8 B" }, { name: "description", content: "Class 8 B homework tracker." }] }),
});

function HomeworkPage() {
  const { user, profile, signInWithGoogle } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["homework"],
    queryFn: async () => {
      const { data } = await supabase.from("homework").select("*").order("due_date", { ascending: true });
      return data ?? [];
    },
  });

  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");

  async function add() {
    if (!user) return signInWithGoogle();
    if (!subject.trim() || !title.trim()) return toast.error("Subject and title needed");
    const { error } = await supabase.from("homework").insert({
      user_id: user.id, author_name: profile?.display_name || "Student",
      subject: subject.trim(), title: title.trim(), description: desc.trim() || null, due_date: due || null,
    });
    if (error) return toast.error("Couldn't add");
    setSubject(""); setTitle(""); setDesc(""); setDue("");
    qc.invalidateQueries({ queryKey: ["homework"] });
    qc.invalidateQueries({ queryKey: ["dash-hw"] });
    toast.success("Homework added");
  }
  async function del(id: string) {
    await supabase.from("homework").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["homework"] });
    qc.invalidateQueries({ queryKey: ["dash-hw"] });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-4">
          <ClipboardList className="w-3.5 h-3.5" /> Tracker
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold"><span className="text-gradient">Homework</span></h1>
      </div>

      <div className="glass rounded-3xl p-5 mb-6 grid gap-3 sm:grid-cols-2">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (Maths, Science…)" />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Ex 4.2 Q1-10)" className="sm:col-span-2" />
        <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details (optional)" className="sm:col-span-2" rows={2} />
        <Button onClick={add} className="sm:col-span-2 bg-hero shadow-soft-glow">
          {!user ? <><LogIn className="w-4 h-4 mr-2" /> Sign in to add</> : <><Plus className="w-4 h-4 mr-2" /> Add Homework</>}
        </Button>
      </div>

      <div className="space-y-3">
        {data.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center text-muted-foreground">No homework. Enjoy! 🎉</div>
        )}
        {data.map((h: any) => (
          <div key={h.id} className="glass rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-hero text-primary-foreground flex items-center justify-center shrink-0 font-bold">{h.subject[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{h.subject} — {h.title}</p>
              {h.description && <p className="text-sm text-muted-foreground mt-1">{h.description}</p>}
              <p className="text-xs text-primary mt-1">
                {h.due_date ? `Due ${new Date(h.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No due date"} · by {h.author_name}
              </p>
            </div>
            {user?.id === h.user_id && (
              <button onClick={() => del(h.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
