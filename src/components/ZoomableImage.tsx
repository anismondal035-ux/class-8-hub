import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, X, RotateCcw } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export function ZoomableImage({ src, alt, className }: Props) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (open) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    }
  }, [open]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(6, Math.max(1, s + (e.deltaY < 0 ? 0.2 : -0.2))));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group relative overflow-hidden rounded-2xl ${className ?? ""}`}
        aria-label="Open zoomable image"
      >
        <img src={src} alt={alt} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-card-soft">
          <Maximize2 className="w-3.5 h-3.5" /> Zoom
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 overflow-hidden bg-background">
          <div
            className="relative w-full h-full overflow-hidden bg-black/95 cursor-grab active:cursor-grabbing"
            onWheel={onWheel}
            onMouseDown={(e) => {
              dragging.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
            }}
            onMouseMove={(e) => {
              if (!dragging.current) return;
              setPos({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y });
            }}
            onMouseUp={() => (dragging.current = null)}
            onMouseLeave={() => (dragging.current = null)}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="select-none absolute left-1/2 top-1/2 max-w-none origin-center"
              style={{
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                transition: dragging.current ? "none" : "transform 0.15s ease",
                maxHeight: "92vh",
                maxWidth: "95vw",
              }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur px-3 py-2 rounded-full shadow-card-soft">
              <Button size="icon" variant="ghost" onClick={() => setScale((s) => Math.max(1, s - 0.3))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium tabular-nums w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button size="icon" variant="ghost" onClick={() => setScale((s) => Math.min(6, s + 0.3))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="absolute top-4 left-4 text-xs text-white/70 bg-black/40 px-3 py-1.5 rounded-full">
              Scroll to zoom · Drag to pan
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
