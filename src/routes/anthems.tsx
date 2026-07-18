import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Flag, Music, BookOpen, School, Save, Edit3, X, Copy, Check, Printer, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/anthems")({
  component: AnthemsPage,
  head: () => ({
    meta: [
      { title: "Anthems & School — Class 8 B" },
      { name: "description", content: "National Anthem, National Song, National Pledge, and School Song of Delhi Public Secondary School, Class 8 B." },
    ],
  }),
});

const JANA_GANA_MANA = `Jana-gana-mana-adhinayaka jaya he,
Bharata-bhagya-vidhata.

Punjab-Sindhu-Gujarata-Maratha,
Dravida-Utkala-Banga,
Vindhya-Himachala-Yamuna-Ganga,
Uchchhala-jaladhi-taranga.

Tava shubha name jage,
Tava shubha asisa mage,
Gahe tava jaya gatha.

Jana-gana-mangala-dayaka jaya he,
Bharata-bhagya-vidhata.

Jaya he, Jaya he, Jaya he,
Jaya jaya jaya, jaya he!`;

const VANDE_MATARAM = `Vande Mataram!
Sujalam, suphalam, malayaja-shitalam,
Shasyashyamalam, Mataram!
Vande Mataram!

Shubhrajyotsna-pulakita-yaminim,
Phullakusumita-drumadala-shobhinim,
Suhasinim sumadhura bhashinim,
Sukhadam varadam, Mataram!
Vande Mataram!`;

const PLEDGE = `India is my country and all Indians are my brothers and sisters.

I love my country, and I am proud of its rich and varied heritage.
I shall always strive to be worthy of it.

I shall give my parents, teachers and all elders respect, and treat everyone with courtesy.

To my country and my people, I pledge my devotion.
In their well-being and prosperity alone lies my happiness.`;

function AnthemsPage() {
  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #anthems-print, #anthems-print * { visibility: visible; }
          #anthems-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; color: #000; background: #fff; }
          #anthems-print .no-print { display: none !important; }
          #anthems-print pre { color: #000 !important; }
          #anthems-print h1, #anthems-print h2, #anthems-print p { color: #000 !important; }
        }
      `}</style>
      <div id="anthems-print" className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10 animate-float-up">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4 no-print">
            <Flag className="w-3.5 h-3.5" /> Pride & Tradition
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold"><span className="text-gradient">Anthems & School</span></h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            The National Anthem, National Song, National Pledge, and our School Song — beautifully in one place.
          </p>
          <div className="mt-5 flex justify-center gap-2 no-print">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> Print all
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnthemCard
            icon={<Music className="w-5 h-5" />}
            title="National Anthem"
            subtitle="Jana Gana Mana · Rabindranath Tagore · Adopted 24 January 1950"
            body={JANA_GANA_MANA}
            accent
          />
          <AnthemCard
            icon={<Music className="w-5 h-5" />}
            title="National Song"
            subtitle="Vande Mataram · Bankim Chandra Chattopadhyay · from Anandamath (1882)"
            body={VANDE_MATARAM}
          />
          <AnthemCard
            icon={<BookOpen className="w-5 h-5" />}
            title="National Pledge"
            subtitle="Composed by Pydimarri Venkata Subba Rao · 1962"
            body={PLEDGE}
            className="lg:col-span-2"
          />
          <SchoolSongCard />
        </div>
      </div>
    </>
  );
}

function AnthemCard({
  icon, title, subtitle, body, className = "", accent = false,
}: { icon: React.ReactNode; title: string; subtitle: string; body: string; className?: string; accent?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [reading, setReading] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <section className={`glass rounded-3xl p-6 sm:p-8 ${accent ? "shadow-glow" : "shadow-soft-glow"} ${className} transition-transform hover:-translate-y-0.5`}>
      <header className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-hero text-primary-foreground shadow-soft-glow">
            {icon}
          </span>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex gap-1.5 no-print">
          <Button size="sm" variant="outline" onClick={() => setReading(r => !r)} title="Reading mode">
            <BookOpenCheck className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={copy} title="Copy text">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </header>
      <pre
        ref={preRef}
        className={`whitespace-pre-wrap font-serif text-foreground/95 selection:bg-primary/30 leading-loose ${
          reading ? "text-lg sm:text-xl tracking-wide" : "text-[15px] sm:text-base"
        }`}
      >
        {body}
      </pre>
    </section>
  );
}

function SchoolSongCard() {
  const { user } = useAuth();
  const [body, setBody] = useState<string>("");
  const [draft, setDraft] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reading, setReading] = useState(false);

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

  async function copy() {
    if (!body) return;
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch { toast.error("Copy failed"); }
  }

  return (
    <section className="glass rounded-3xl p-6 sm:p-8 lg:col-span-2 shadow-soft-glow transition-transform hover:-translate-y-0.5">
      <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-hero text-primary-foreground shadow-soft-glow">
            <School className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold">School Song</h2>
            <p className="text-xs text-muted-foreground">Delhi Public Secondary School, Barasat</p>
          </div>
        </div>
        <div className="flex gap-1.5 no-print">
          {body && !editing && (
            <>
              <Button size="sm" variant="outline" onClick={() => setReading(r => !r)} title="Reading mode">
                <BookOpenCheck className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={copy} title="Copy">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </>
          )}
          {user && !editing && (
            <Button size="sm" variant="outline" onClick={() => { setDraft(body); setEditing(true); }}>
              <Edit3 className="w-4 h-4 mr-1.5" /> {body ? "Edit" : "Add lyrics"}
            </Button>
          )}
        </div>
      </header>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            placeholder="Paste the school song lyrics here…"
            className="w-full bg-secondary/60 border border-border rounded-xl p-4 text-[15px] leading-relaxed font-serif focus:outline-none focus:ring-2 focus:ring-primary/50"
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
        <pre className={`whitespace-pre-wrap font-serif text-foreground/95 selection:bg-primary/30 leading-loose ${
          reading ? "text-lg sm:text-xl tracking-wide" : "text-[15px] sm:text-base"
        }`}>
          {body}
        </pre>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <p className="italic">School song lyrics will be added by the administrator.</p>
          {!user && <p className="text-xs mt-2">Sign in as an administrator to add lyrics.</p>}
        </div>
      )}
    </section>
  );
}
