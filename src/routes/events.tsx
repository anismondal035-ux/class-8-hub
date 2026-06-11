import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, Plus, Trash2, LogIn } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/events")({
  component: EventsPage,
  head: () => ({ meta: [{ title: "Events — Class 8 B" }, { name: "description", content: "Upcoming Class 8 B events and countdowns." }] }),
});

function EventsPage() {
  const { user, profile, signInWithGoogle } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      return data ?? [];
    },
  });

  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [date, setDate] = useState("");

  async function add() {
    if (!user) return signInWithGoogle();
    if (!title.trim() || !date) return toast.error("Title & date needed");
    const { error } = await supabase.from("events").insert({
      user_id: user.id, author_name: profile?.display_name || "Student",
      title: title.trim(), description: desc.trim() || null, event_date: date,
    });
    if (error) return toast.error("Couldn't add");
    setTitle(""); setDesc(""); setDate("");
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["dash-events"] });
    toast.success("Event added");
  }
  async function del(id: string) {
    await supabase.from("events").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["dash-events"] });
  }
  function days(d: string) {
    return Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = data.filter((e: any) => e.event_date >= today);
  const past = data.filter((e: any) => e.event_date < today);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-4">
          <CalendarClock className="w-3.5 h-3.5" /> Calendar
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold"><span className="text-gradient">Events</span></h1>
      </div>

      <div className="glass rounded-3xl p-5 mb-6 grid gap-3 sm:grid-cols-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details (optional)" className="sm:col-span-2" rows={2} />
        <Button onClick={add} className="sm:col-span-2 bg-hero shadow-soft-glow">
          {!user ? <><LogIn className="w-4 h-4 mr-2" /> Sign in to add</> : <><Plus className="w-4 h-4 mr-2" /> Add Event</>}
        </Button>
      </div>

      <h2 className="font-bold mb-3 text-lg">Upcoming</h2>
      <div className="space-y-3 mb-8">
        {upcoming.length === 0 && <div className="glass rounded-3xl p-8 text-center text-muted-foreground">No upcoming events.</div>}
        {upcoming.map((e: any) => {
          const d = days(e.event_date);
          return (
            <div key={e.id} className="glass rounded-2xl p-4 flex items-start gap-4">
              <div className="text-center shrink-0 w-16">
                <div className="text-3xl font-bold text-gradient">{d === 0 ? "🎉" : d}</div>
                <div className="text-[10px] uppercase text-muted-foreground">{d === 0 ? "Today" : d === 1 ? "day" : "days"}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{e.title}</p>
                {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
                <p className="text-xs text-primary mt-1">{new Date(e.event_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · by {e.author_name}</p>
              </div>
              {user?.id === e.user_id && (
                <button onClick={() => del(e.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          );
        })}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="font-bold mb-3 text-lg text-muted-foreground">Past</h2>
          <div className="space-y-2">
            {past.map((e: any) => (
              <div key={e.id} className="glass rounded-xl p-3 opacity-60 flex justify-between text-sm">
                <span>{e.title}</span>
                <span className="text-muted-foreground">{new Date(e.event_date).toLocaleDateString("en-GB")}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
