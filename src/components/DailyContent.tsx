import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDailyContent, ensureDailyImage, shuffleDaily, generatePoster } from "@/lib/daily.functions";
import { ZoomableImage } from "./ZoomableImage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Quote, Calendar, Loader2, Shuffle, ImageIcon } from "lucide-react";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Extra = { word: string; word_meaning: string; thought: string; thought_author: string | null };

export function DailyContent() {
  const fn = useServerFn(getDailyContent);
  const imgFn = useServerFn(ensureDailyImage);
  const shuffleFn = useServerFn(shuffleDaily);
  const posterFn = useServerFn(generatePoster);
  const date = todayISO();

  const { data, isLoading } = useQuery({
    queryKey: ["daily", date],
    queryFn: () => fn({ data: { date } }),
    staleTime: 1000 * 60 * 60,
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [extra, setExtra] = useState<Extra | null>(null);
  const [extraImage, setExtraImage] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);

  // Lazily fetch today's poster.
  useEffect(() => {
    if (extra) return;
    if (!data || data.image_url || imageUrl || imageLoading) return;
    setImageLoading(true);
    imgFn({ data: { date } })
      .then((r) => setImageUrl(r.image_url))
      .catch(() => {})
      .finally(() => setImageLoading(false));
  }, [data, imageUrl, imageLoading, date, imgFn, extra]);

  const prettyDate = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const shown = extra ?? data;
  const finalImage = extra ? extraImage : (data?.image_url || imageUrl);
  const showImageLoader = extra ? shuffling || (!extraImage) : imageLoading || (data && !data.image_url);

  async function onShuffle() {
    setShuffling(true);
    setExtraImage(null);
    try {
      const r = await shuffleFn({ data: { date, seed: Math.floor(Math.random() * 1_000_000) } });
      setExtra(r);
      // Generate a fresh poster for the new word in the background.
      posterFn({ data: { word: r.word, thought: r.thought } })
        .then((p) => setExtraImage(p.image_url))
        .catch(() => {});
    } catch {} finally { setShuffling(false); }
  }

  return (
    <Card className="overflow-hidden bg-card-gradient border-border shadow-card-soft">
      <div className="grid lg:grid-cols-2 gap-0">
        <div className="p-8 lg:p-10 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Calendar className="w-4 h-4" /> {prettyDate}
            </div>
            <Button size="sm" variant="outline" onClick={onShuffle} disabled={shuffling || isLoading} className="h-8">
              {shuffling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
              <span className="ml-1.5 text-xs">Another</span>
            </Button>
          </div>

          {isLoading || !shown ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                  <BookOpen className="w-4 h-4" /> Word of the Day
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gradient mb-2">{shown.word}</h2>
                <p className="text-base lg:text-lg text-foreground/80">{shown.word_meaning}</p>
              </div>

              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                  <Quote className="w-4 h-4" /> Thought of the Day
                </div>
                <blockquote className="text-xl lg:text-2xl font-medium leading-snug text-foreground italic">
                  "{shown.thought}"
                </blockquote>
                {shown.thought_author && (
                  <p className="mt-3 text-sm text-muted-foreground">— {shown.thought_author}</p>
                )}
              </div>
              {extra && (
                <button onClick={() => { setExtra(null); setExtraImage(null); }} className="text-xs text-primary hover:underline self-start">
                  ← Back to today's official one
                </button>
              )}
            </>
          )}
        </div>

        <div className="relative bg-secondary min-h-[320px] lg:min-h-[480px] flex items-center justify-center p-6">
          {finalImage ? (
            <ZoomableImage src={finalImage} alt={`Word of the day: ${shown?.word}`} className="w-full h-full max-h-[480px] shadow-card-soft" />
          ) : showImageLoader ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground text-center">
              <ImageIcon className="w-10 h-10 opacity-40" />
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-xs">Painting the poster… (about 10 seconds)</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
