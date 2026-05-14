import { createFileRoute } from "@tanstack/react-router";
import { ZoomableImage } from "@/components/ZoomableImage";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/routine")({
  component: RoutinePage,
  head: () => ({
    meta: [
      { title: "Class Routine — Class 8 B" },
      { name: "description", content: "Class 8 B weekly class routine. Tap the image to zoom." },
    ],
  }),
});

// Replace this URL with your routine picture (drop the file in /public or upload via chat)
const ROUTINE_IMAGE = "/routine.jpg";

function RoutinePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Calendar className="w-3.5 h-3.5" /> Weekly schedule
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold">
          Class <span className="text-gradient">Routine</span>
        </h1>
        <p className="mt-3 text-muted-foreground">Tap the picture to zoom and pan — perfect for the smartboard.</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-3 shadow-card-soft">
        <ImageOrPlaceholder />
      </div>
    </div>
  );
}

function ImageOrPlaceholder() {
  return (
    <div className="relative">
      <ZoomableImage src={ROUTINE_IMAGE} alt="Class 8 B weekly routine — Class teacher: Aritri Das" className="w-full max-h-[80vh]" />
    </div>
  );
}
