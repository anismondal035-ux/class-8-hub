import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getDailyContent,
  ensureDailyImage,
  shuffleDaily,
  generatePoster,
} from "@/lib/daily.functions";
import { ZoomableImage } from "@/components/ZoomableImage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar, Quote, BookOpen, Loader2, Shuffle, ImageIcon,
  Download, Maximize2, Sparkles, Sun,
} from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/daily")({
  component: DailyPage,
  head: () => ({
    meta: [
      { title: "Daily Inspiration — Class 8 B" },
      { name: "description", content: "Today's Word of the Day, meaning, example sentence, and Thought of the Day for Class 8 B students." },
    ],
  }),
});

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function DailyPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getDailyContent);
  const imgFn = useServerFn(ensureDailyImage);
  const shuffleFn = useServerFn(shuffleDaily);
  const posterFn = useServerFn(generatePoster);
  const overrideFn = useServerFn(setDailyOverride);
  const { user } = useAuth();

  const date = todayISO();
  const prettyDate = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const dayName = new Date(date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["daily", date],
    queryFn: () => getFn({ data: { date } }),
    staleTime: 1000 * 60 * 60,
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [shuffleOverride, setShuffleOverride] = useState<null | {
    word: string; word_meaning: string; word_example?: string; thought: string; thought_author: string | null;
  }>(null);

  // Lazily fetch today's poster.
  useEffect(() => {
    if (shuffleOverride) return;
    if (!data) return;
    if (data.image_url) { setImageUrl(data.image_url); return; }
    if (imageLoading || imageUrl) return;
    setImageLoading(true);
    imgFn({ data: { date } })
      .then((r) => setImageUrl(r.image_url))
      .catch(() => {})
      .finally(() => setImageLoading(false));
  }, [data, imageUrl, imageLoading, date, imgFn, shuffleOverride]);

  const shown = shuffleOverride ?? data;
  const finalImage = shuffleOverride ? imageUrl : (data?.image_url ?? imageUrl);

  async function onShuffle() {
    try {
      const r = await shuffleFn({ data: { date, seed: Math.floor(Math.random() * 1_000_000) } });
      setShuffleOverride(r);
      setImageUrl(null);
      setImageLoading(true);
      const img = await posterFn({
        data: { word: r.word, word_meaning: r.word_meaning, thought: r.thought, date },
      });
      setImageUrl(img.image_url);
    } catch {
      toast.error("Couldn't shuffle. Try again.");
    } finally {
      setImageLoading(false);
    }
  }

  async function regenerateImage() {
    if (!shown) return;
    setImageLoading(true);
    setImageUrl(null);
    try {
      const img = await posterFn({
        data: { word: shown.word, word_meaning: shown.word_meaning, thought: shown.thought, date },
      });
      if (img.image_url) {
        setImageUrl(img.image_url);
        toast.success("New poster generated");
      } else {
        toast.error("Image service didn't respond. Try again.");
      }
    } finally {
      setImageLoading(false);
    }
  }

  async function download() {
    if (!finalImage) return;
    try {
      const res = await fetch(finalImage);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `daily-inspiration-${date}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success("Poster downloaded");
    } catch {
      toast.error("Download failed");
    }
  }

  if (isLoading || !shown) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="mt-3 text-muted-foreground">Loading today's inspiration…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-4">
          <Sun className="w-3.5 h-3.5" /> Daily Inspiration
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Today's <span className="text-gradient">Word & Thought</span>
        </h1>
        <p className="mt-4 inline-flex items-center gap-2 text-base sm:text-lg text-muted-foreground">
          <Calendar className="w-4 h-4" /> {prettyDate}
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: text content */}
        <div className="space-y-5">
          <Card className="p-6 glass-strong shadow-card-soft">
            <div className="flex items-center gap-2 text-primary mb-3">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Word of the Day</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gradient mb-3">{shown.word}</h2>
            <p className="text-base sm:text-lg italic text-muted-foreground mb-3">
              {shown.word_meaning}
            </p>
            {shown.word_example && (
              <div className="border-l-2 border-primary/40 pl-4 py-1 text-sm sm:text-base">
                <span className="text-xs font-semibold uppercase text-primary block mb-1">Example</span>
                <span>"{shown.word_example}"</span>
              </div>
            )}
          </Card>

          <Card className="p-6 glass-strong shadow-card-soft">
            <div className="flex items-center gap-2 text-primary mb-3">
              <Quote className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Thought of the Day</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold leading-snug">
              "{shown.thought}"
            </p>
            {shown.thought_author && (
              <p className="mt-3 text-sm text-primary font-semibold">— {shown.thought_author}</p>
            )}
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onShuffle} variant="outline" className="gap-2">
              <Shuffle className="w-4 h-4" /> Shuffle another
            </Button>
            <Button onClick={regenerateImage} variant="outline" className="gap-2" disabled={imageLoading}>
              <ImageIcon className="w-4 h-4" /> {imageLoading ? "Generating…" : "Regenerate poster"}
            </Button>
          </div>
        </div>

        {/* Right: image */}
        <div>
          <Card className="p-3 glass-strong shadow-glow">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary/40">
              {finalImage ? (
                <ZoomableImage src={finalImage} alt={`Daily inspiration poster for ${prettyDate}`} className="w-full h-full" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  {imageLoading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm">Painting today's poster…</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8" />
                      <p className="text-sm">Poster not generated yet</p>
                      <Button size="sm" onClick={regenerateImage}>Generate now</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
          {finalImage && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              <Button size="sm" variant="outline" onClick={() => window.open(finalImage, "_blank")}>
                <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Full screen
              </Button>
              <Button size="sm" variant="outline" onClick={download}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Admin override is intentionally hidden from the UI.
          Backend server fn `setDailyOverride` remains available for admin use. */}


      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3" /> Content rotates automatically every day — {dayName} pick
      </p>
    </div>
  );
}

function AdminOverride({
  date, current, onSave,
}: {
  date: string;
  current: { word: string; word_meaning: string; word_example?: string; thought: string; thought_author: string | null };
  onSave: (patch: { word?: string; word_meaning?: string; word_example?: string; thought?: string; thought_author?: string | null }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState(current.word);
  const [meaning, setMeaning] = useState(current.word_meaning);
  const [example, setExample] = useState(current.word_example ?? "");
  const [thought, setThought] = useState(current.thought);
  const [author, setAuthor] = useState(current.thought_author ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave({
        word: word.trim() || undefined,
        word_meaning: meaning.trim() || undefined,
        word_example: example.trim() || undefined,
        thought: thought.trim() || undefined,
        thought_author: author.trim() ? author.trim() : null,
      });
      setOpen(false);
    } finally { setSaving(false); }
  }

  return (
    <Card className="p-5 glass">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <Settings className="w-4 h-4" /> Manual override (signed in) {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Change today's word or thought. Saving will regenerate the poster image.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">Word</label>
              <Input value={word} onChange={(e) => setWord(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold">Thought author</label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="(optional)" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Meaning</label>
            <Input value={meaning} onChange={(e) => setMeaning(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold">Example sentence</label>
            <Input value={example} onChange={(e) => setExample(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold">Thought</label>
            <Textarea value={thought} onChange={(e) => setThought(e.target.value)} rows={2} />
          </div>
          <Button onClick={save} disabled={saving} className="bg-hero shadow-glow">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            Save & regenerate
          </Button>
        </div>
      )}
    </Card>
  );
}
