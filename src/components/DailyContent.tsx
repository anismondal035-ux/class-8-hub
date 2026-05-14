import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDailyContent } from "@/lib/daily.functions";
import { ZoomableImage } from "./ZoomableImage";
import { Card } from "@/components/ui/card";
import { BookOpen, Quote, Calendar, Loader2 } from "lucide-react";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DailyContent() {
  const fn = useServerFn(getDailyContent);
  const date = todayISO();
  const { data, isLoading } = useQuery({
    queryKey: ["daily", date],
    queryFn: () => fn({ data: { date } }),
    staleTime: 1000 * 60 * 60,
  });

  const prettyDate = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="overflow-hidden bg-card-gradient border-border shadow-card-soft">
      <div className="grid lg:grid-cols-2 gap-0">
        <div className="p-8 lg:p-10 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Calendar className="w-4 h-4" /> {prettyDate}
          </div>

          {isLoading || !data ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Preparing today's word & thought…
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                  <BookOpen className="w-4 h-4" /> Word of the Day
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gradient mb-2">{data.word}</h2>
                <p className="text-base lg:text-lg text-foreground/80">{data.word_meaning}</p>
              </div>

              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                  <Quote className="w-4 h-4" /> Thought of the Day
                </div>
                <blockquote className="text-xl lg:text-2xl font-medium leading-snug text-foreground italic">
                  "{data.thought}"
                </blockquote>
                {data.thought_author && (
                  <p className="mt-3 text-sm text-muted-foreground">— {data.thought_author}</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative bg-secondary min-h-[320px] lg:min-h-[480px] flex items-center justify-center p-6">
          {isLoading || !data ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Generating today's poster…</p>
            </div>
          ) : data.image_url ? (
            <ZoomableImage src={data.image_url} alt={`Word of the day: ${data.word}`} className="w-full h-full max-h-[480px] shadow-card-soft" />
          ) : (
            <div className="text-center p-8 bg-background rounded-2xl">
              <h3 className="text-3xl font-bold text-gradient mb-3">{data.word}</h3>
              <p className="italic text-foreground/80">"{data.thought}"</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
