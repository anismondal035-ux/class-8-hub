import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cake, Plus, Trash2, PartyPopper } from "lucide-react";

export const Route = createFileRoute("/birthdays")({
  component: BirthdaysPage,
  head: () => ({
    meta: [
      { title: "Birthdays — Class 8 B" },
      { name: "description", content: "Class 8 B birthday calendar — never miss a birthday." },
    ],
  }),
});

type Birthday = { id: string; name: string; date: string };
const KEY = "class8b-birthdays-v1";
const load = (): Birthday[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const save = (b: Birthday[]) => localStorage.setItem(KEY, JSON.stringify(b));

function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); 
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

function BirthdaysPage() {
  const [items, setItems] = useState<Birthday[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => { setItems(load()); }, []);

  function add() {
    if (!name.trim() || !date) return;
    const next = [...items, { id: crypto.randomUUID(), name: name.trim(), date }];
    setItems(next); save(next); setName(""); setDate("");
  }
  function remove(id: string) {
    const next = items.filter((b) => b.id !== id);
    setItems(next); save(next);
  }

  const sorted = useMemo(() => [...items].sort((a, b) => daysUntil(a.date) - daysUntil(b.date)), [items]);
  const today = sorted.filter((b) => daysUntil(b.date) === 0);
  const upcoming = sorted.filter((b) => daysUntil(b.date) > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Cake className="w-3.5 h-3.5" /> Birthday calendar
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold"><span className="text-gradient">Birthdays</span></h1>
      </div>

      {today.length > 0 && (
        <div className="glass rounded-3xl p-6 mb-6 text-center bg-accent-gradient">
          <PartyPopper className="w-10 h-10 mx-auto text-primary-foreground mb-2" />
          <h2 className="text-2xl font-bold text-primary-foreground">🎉 Happy Birthday {today.map(t => t.name).join(", ")}!</h2>
        </div>
      )}

      <div className="glass rounded-3xl p-5 mb-6 grid sm:grid-cols-[1fr_180px_auto] gap-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button onClick={add} className="bg-hero shadow-glow"><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>

      <div className="space-y-3">
        {upcoming.length === 0 && items.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center text-muted-foreground">No birthdays yet. Add your friends above!</div>
        )}
        {upcoming.map((b) => {
          const d = daysUntil(b.date);
          const dt = new Date(b.date);
          return (
            <div key={b.id} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-hero text-primary-foreground font-bold flex items-center justify-center shrink-0 shadow-glow">
                {b.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{b.name}</p>
                <p className="text-sm text-muted-foreground">
                  {dt.toLocaleDateString("en-GB", { day: "numeric", month: "long" })} · {d === 1 ? "Tomorrow!" : `in ${d} days`}
                </p>
              </div>
              <button onClick={() => remove(b.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
