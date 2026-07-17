import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flag, Music, BookOpen, School, Save, Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/anthems")({
  component: AnthemsPage,
  head: () => ({
    meta: [
      { title: "Anthems & School — Class 8 B" },
      { name: "description", content: "National Anthem, National Song, National Pledge, and School Song." },
    ],
  }),
});

const JANA_GANA_MANA = `Jana-gana-mana-adhinayaka jaya he
Bharata-bhagya-vidhata.
Punjab-Sindh-Gujarat-Maratha
Dravida-Utkala-Banga
Vindhya-Himachala-Yamuna-Ganga
Uchchhala-jaladhi-taranga.
Tava shubha name jage,
Tava shubha asisa mage,
Gahe tava jaya gatha.
Jana-gana-mangala-dayaka jaya he
Bharata-bhagya-vidhata.
Jaya he, jaya he, jaya he,
Jaya jaya jaya, jaya he!`;

const VANDE_MATARAM = `Vande Mataram!
Sujalam, suphalam, malayaja shitalam,
Shasyashyamalam, Mataram!
Vande Mataram!

Shubhrajyotsna pulakitayaminim,
Phullakusumita drumadala shobhinim,
Suhasinim sumadhura bhashinim,
Sukhadam varadam, Mataram!
Vande Mataram!`;

const PLEDGE = `India is my country. All Indians are my brothers and sisters.
I love my country, and I am proud of its rich and varied heritage.
I shall always strive to be worthy of it.
I shall give my parents, teachers and all elders respect, and treat everyone with courtesy.
To my country and my people, I pledge my devotion.
In their well-being and prosperity alone, lies my happiness.`;

function AnthemsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10 animate-float-up">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Flag className="w-3.5 h-3.5" /> Pride & Tradition
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold"><span className="text-gradient">Anthems & School</span></h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">National Anthem, National Song, National Pledge, and our School Song — all in one place.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnthemCard icon={<Music className="w-5 h-5" />} title="National Anthem" subtitle="Jana Gana Mana · Rabindranath Tagore" body={JANA_GANA_MANA} accent />
        <AnthemCard icon={<Music className="w-5 h-5" />} title="National Song" subtitle="Vande Mataram · Bankim Chandra Chattopadhyay" body={VANDE_MATARAM} />
        <AnthemCard icon={<BookOpen className="w-5 h-5" />} title="National Pledge" subtitle="Composed by Pydimarri Venkata Subba Rao" body={PLEDGE} className="lg:col-span-2" />
        <SchoolSongCard />
      </div>
    </div>
  );
}

function AnthemCard({ icon, title, subtitle, body, className = "", accent = false }: { icon: React.ReactNode; title: string; subtitle: string; body: string; className?: string; accent?: boolean }) {
  return (
    <section className={`glass rounded-3xl p-6 sm:p-8 ${accent ? "shadow-glow" : "shadow-soft-glow"} ${className}`}>
      <header className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-hero text-primary-foreground shadow-soft-glow">{icon}</span>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground/90 selection:bg-primary/30">{body}</pre>
    </section>
  );
}

function SchoolSongCard() {
  const { user } = useAuth();
  const [body, setBody] = useState<string>("");
  const [draft, setDraft] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_content").select("body").eq("key", "school_song").maybeSingle();
      const b = data?.body ?? "";
      setBody(b);
      setDraft(b);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "school_song", body: draft, updated_by: user?.id ?? null, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast.error("Couldn't save: " + error.message); return; }
    setBody(draft);
    setEditing(false);
    toast.success("School song published");
  }

  return (
    <section className="glass rounded-3xl p-6 sm:p-8 lg:col-span-2 shadow-soft-glow">
      <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-hero text-primary-foreground shadow-soft-glow"><School className="w-5 h-5" /></span>
          <div>
            <h2 className="text-xl font-bold">School Song</h2>
            <p className="text-xs text-muted-foreground">Delhi Public Secondary School, Barasat</p>
          </div>
        </div>
        {user && !editing && (
          <Button size="sm" variant="outline" onClick={() => { setDraft(body); setEditing(true); }}>
            <Edit3 className="w-4 h-4 mr-1.5" /> {body ? "Edit" : "Add lyrics"}
          </Button>
        )}
      </header>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            placeholder="Paste the school song lyrics here…"
            className="w-full bg-secondary/60 border border-border rounded-xl p-4 text-[15px] leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(body); }}>
              <X className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-hero shadow-soft-glow">
              <Save className="w-4 h-4 mr-1.5" /> {saving ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </div>
      ) : body ? (
        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground/90 selection:bg-primary/30">{body}</pre>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <p className="italic">School song lyrics will be added by the administrator.</p>
          {!user && <p className="text-xs mt-2">Sign in to add lyrics.</p>}
        </div>
      )}
    </section>
  );
}
