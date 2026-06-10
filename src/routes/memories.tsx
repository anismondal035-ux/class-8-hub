import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Plus, Search, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/memories")({
  component: MemoriesPage,
  head: () => ({
    meta: [
      { title: "Class Memories — Class 8 B" },
      { name: "description", content: "Photos, events, and memories from Class 8 B." },
    ],
  }),
});

type Memory = { id: string; caption: string; event: string; year: string; dataUrl: string; createdAt: number };

const KEY = "class8b-memories-v1";

function load(): Memory[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(m: Memory[]) { localStorage.setItem(KEY, JSON.stringify(m)); }

function MemoriesPage() {
  const [items, setItems] = useState<Memory[]>([]);
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Memory | null>(null);
  const [caption, setCaption] = useState("");
  const [event, setEvent] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => { setItems(load()); }, []);

  async function onFile(files: FileList | null) {
    if (!files?.length) return;
    const newOnes: Memory[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 2_500_000) { toast.error(`${f.name} is too large (max 2.5MB)`); continue; }
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      newOnes.push({
        id: crypto.randomUUID(), caption: caption || f.name, event: event || "General",
        year: year || String(new Date().getFullYear()), dataUrl, createdAt: Date.now(),
      });
    }
    const next = [...newOnes, ...items];
    setItems(next); save(next);
    setCaption(""); setEvent("");
    toast.success(`Added ${newOnes.length} photo${newOnes.length > 1 ? "s" : ""}`);
  }

  function remove(id: string) {
    const next = items.filter((m) => m.id !== id);
    setItems(next); save(next);
  }

  const filtered = q
    ? items.filter((m) => `${m.caption} ${m.event} ${m.year}`.toLowerCase().includes(q.toLowerCase()))
    : items;

  const byEvent = filtered.reduce<Record<string, Memory[]>>((acc, m) => {
    const key = `${m.event} · ${m.year}`;
    (acc[key] ||= []).push(m); return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Camera className="w-3.5 h-3.5" /> Album
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold">Class <span className="text-gradient">Memories</span></h1>
        <p className="mt-3 text-muted-foreground">Saved on your device. Add photos from picnics, sports day, fests, anything.</p>
      </div>

      <div className="glass rounded-3xl p-5 mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto]">
        <Input placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <Input placeholder="Event (e.g. Sports Day)" value={event} onChange={(e) => setEvent(e.target.value)} />
        <Input placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        <label>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFile(e.target.files)} />
          <span className="inline-flex items-center justify-center w-full h-10 px-4 rounded-md bg-hero text-primary-foreground shadow-glow font-medium cursor-pointer text-sm">
            <Plus className="w-4 h-4 mr-2" /> Add
          </span>
        </label>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by event, year or caption…" className="pl-10" />
      </div>

      {items.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center text-muted-foreground">
          No photos yet. Add your first memory above!
        </div>
      )}

      {Object.entries(byEvent).map(([k, arr]) => (
        <section key={k} className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-foreground">{k}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {arr.map((m) => (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card cursor-zoom-in" onClick={() => setViewing(m)}>
                <img src={m.dataUrl} alt={m.caption} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white truncate">{m.caption}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(m.id); }} className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <button onClick={() => setViewing(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white"><X className="w-5 h-5" /></button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={viewing.dataUrl} alt={viewing.caption} className="w-full max-h-[80vh] object-contain rounded-2xl" />
            <p className="text-center text-white mt-4">{viewing.caption} · <span className="opacity-70">{viewing.event} · {viewing.year}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
