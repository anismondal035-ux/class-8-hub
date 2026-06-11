import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Plus, Search, X, Trash2, LogIn, Heart, MessageCircle, Download, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/memories")({
  component: MemoriesPage,
  head: () => ({
    meta: [{ title: "Class Memories — Class 8 B" }, { name: "description", content: "Class 8 B photo album — cloud-backed memories." }],
  }),
});

const REACTIONS = ["❤️","🔥","😂","🎉","💜"];

function PhotoCard({ p, onOpen }: { p: any; onOpen: () => void }) {
  const { data: reactions = [] } = useQuery({
    queryKey: ["reactions", p.id],
    queryFn: async () => (await supabase.from("memory_reactions").select("emoji").eq("photo_id", p.id)).data ?? [],
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["comments-count", p.id],
    queryFn: async () => (await supabase.from("memory_comments").select("id", { count: "exact" }).eq("photo_id", p.id)).data ?? [],
  });
  const counts: Record<string, number> = {};
  reactions.forEach((r: any) => { counts[r.emoji] = (counts[r.emoji] ?? 0) + 1; });

  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card cursor-zoom-in" onClick={onOpen}>
      <img src={p.image_url} alt={p.caption ?? ""} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-xs text-white truncate">{p.caption ?? p.album}</p>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-white/90">
          {Object.entries(counts).slice(0, 3).map(([e, n]) => <span key={e}>{e} {n}</span>)}
          {comments.length > 0 && <span className="ml-auto"><MessageCircle className="w-3 h-3 inline" /> {comments.length}</span>}
        </div>
      </div>
    </div>
  );
}

function Lightbox({ photos, index, onClose, onIndex }: { photos: any[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const { user, profile, signInWithGoogle } = useAuth();
  const qc = useQueryClient();
  const p = photos[index];
  const [comment, setComment] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", p.id],
    queryFn: async () => (await supabase.from("memory_comments").select("*").eq("photo_id", p.id).order("created_at", { ascending: true })).data ?? [],
  });
  const { data: reactions = [] } = useQuery({
    queryKey: ["reactions-full", p.id],
    queryFn: async () => (await supabase.from("memory_reactions").select("*").eq("photo_id", p.id)).data ?? [],
  });

  async function react(emoji: string) {
    if (!user) return signInWithGoogle();
    const mine = reactions.find((r: any) => r.user_id === user.id && r.emoji === emoji);
    if (mine) await supabase.from("memory_reactions").delete().eq("id", mine.id);
    else await supabase.from("memory_reactions").insert({ photo_id: p.id, user_id: user.id, emoji });
    qc.invalidateQueries({ queryKey: ["reactions-full", p.id] });
    qc.invalidateQueries({ queryKey: ["reactions", p.id] });
  }
  async function addComment() {
    if (!user) return signInWithGoogle();
    if (!comment.trim()) return;
    await supabase.from("memory_comments").insert({
      photo_id: p.id, user_id: user.id, display_name: profile?.display_name || "Student", content: comment.trim(),
    });
    setComment("");
    qc.invalidateQueries({ queryKey: ["comments", p.id] });
    qc.invalidateQueries({ queryKey: ["comments-count", p.id] });
  }
  const counts: Record<string, number> = {};
  reactions.forEach((r: any) => { counts[r.emoji] = (counts[r.emoji] ?? 0) + 1; });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndex((index + 1) % photos.length);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [index, photos.length, onIndex, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white z-10"><X className="w-5 h-5" /></button>
      <button onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + photos.length) % photos.length); }} className="absolute left-4 p-3 rounded-full bg-white/10 text-white z-10"><ChevronLeft className="w-5 h-5" /></button>
      <button onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % photos.length); }} className="absolute right-4 p-3 rounded-full bg-white/10 text-white z-10"><ChevronRight className="w-5 h-5" /></button>
      <div className="max-w-6xl w-full grid lg:grid-cols-[1fr_360px] gap-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <img src={p.image_url} alt={p.caption ?? ""} className="w-full max-h-[80vh] object-contain rounded-2xl" />
          <div className="flex items-center justify-between mt-3 text-white">
            <p>{p.caption} <span className="opacity-60 text-sm">· {p.album} · {p.year}</span></p>
            <a href={p.image_url} download target="_blank" rel="noopener" className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><Download className="w-4 h-4" /></a>
          </div>
          <div className="flex gap-2 mt-3">
            {REACTIONS.map((e) => {
              const mine = reactions.some((r: any) => r.user_id === user?.id && r.emoji === e);
              return (
                <button key={e} onClick={() => react(e)} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${mine ? "bg-primary text-primary-foreground" : "bg-white/10 text-white hover:bg-white/20"}`}>
                  {e} <span className="text-xs opacity-80">{counts[e] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="glass-strong rounded-2xl p-4 flex flex-col max-h-[80vh]">
          <h3 className="font-bold mb-3 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> Comments ({comments.length})</h3>
          <div className="flex-1 overflow-y-auto space-y-3 mb-3">
            {comments.length === 0 && <p className="text-sm text-muted-foreground">Be the first to comment.</p>}
            {comments.map((c: any) => (
              <div key={c.id} className="text-sm">
                <p><b className="text-primary">{c.display_name}</b> <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span></p>
                <p className="text-foreground/90">{c.content}</p>
              </div>
            ))}
          </div>
          {user ? (
            <div className="flex gap-2">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} placeholder="Write a comment…" />
              <Button onClick={addComment} size="sm" className="bg-hero">Post</Button>
            </div>
          ) : (
            <Button onClick={signInWithGoogle} className="bg-hero w-full"><LogIn className="w-4 h-4 mr-2" /> Sign in to comment</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MemoriesPage() {
  const { user, profile, signInWithGoogle } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [album, setAlbum] = useState("General");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [slideshow, setSlideshow] = useState(false);

  const { data: photos = [] } = useQuery({
    queryKey: ["photos"],
    queryFn: async () => (await supabase.from("memory_photos").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    if (!slideshow || viewIdx === null) return;
    const t = setInterval(() => setViewIdx((i) => (i! + 1) % photos.length), 3500);
    return () => clearInterval(t);
  }, [slideshow, viewIdx, photos.length]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    if (!user) { signInWithGoogle(); return; }
    setUploading(true);
    let n = 0;
    for (const f of Array.from(files)) {
      if (f.size > 10_000_000) { toast.error(`${f.name} too large (max 10MB)`); continue; }
      const ext = f.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("memories").upload(path, f, { contentType: f.type });
      if (upErr) { toast.error(`Upload failed: ${f.name}`); continue; }
      const { data: pub } = supabase.storage.from("memories").getPublicUrl(path);
      const { error: insErr } = await supabase.from("memory_photos").insert({
        user_id: user.id, uploader_name: profile?.display_name || "Student",
        storage_path: path, image_url: pub.publicUrl,
        caption: caption || null, album: album || "General", year: parseInt(year) || new Date().getFullYear(),
      });
      if (!insErr) n++;
    }
    setUploading(false); setCaption("");
    qc.invalidateQueries({ queryKey: ["photos"] });
    qc.invalidateQueries({ queryKey: ["dash-photos"] });
    if (n) toast.success(`Uploaded ${n} photo${n > 1 ? "s" : ""} to the cloud`);
  }

  async function remove(p: any) {
    await supabase.storage.from("memories").remove([p.storage_path]).catch(() => {});
    await supabase.from("memory_photos").delete().eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["photos"] });
  }

  const filtered = q ? photos.filter((p: any) => `${p.caption ?? ""} ${p.album} ${p.year}`.toLowerCase().includes(q.toLowerCase())) : photos;
  const byAlbum = filtered.reduce<Record<string, any[]>>((acc, p: any) => {
    const k = `${p.album} · ${p.year}`; (acc[k] ||= []).push(p); return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-4">
          <Camera className="w-3.5 h-3.5" /> Cloud album
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold">Class <span className="text-gradient">Memories</span></h1>
        <p className="mt-3 text-muted-foreground">Saved permanently in the cloud · React, comment, slideshow & download</p>
      </div>

      <div className="glass rounded-3xl p-5 mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto]">
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" />
        <Input value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album (Sports Day, Picnic…)" />
        <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" />
        <input type="file" ref={fileRef} accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
        <Button onClick={() => user ? fileRef.current?.click() : signInWithGoogle()} disabled={uploading} className="bg-hero shadow-soft-glow">
          {uploading ? "Uploading…" : !user ? <><LogIn className="w-4 h-4 mr-2" /> Sign in</> : <><Plus className="w-4 h-4 mr-2" /> Upload</>}
        </Button>
      </div>

      <div className="relative mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by album, year or caption…" className="pl-10" />
        </div>
        {photos.length > 0 && (
          <Button variant="outline" onClick={() => { setViewIdx(0); setSlideshow(true); }}>
            <Play className="w-4 h-4 mr-1.5" /> Slideshow
          </Button>
        )}
      </div>

      {photos.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center text-muted-foreground">No photos yet. Sign in and upload the first memory!</div>
      )}

      {Object.entries(byAlbum).map(([k, arr]) => (
        <section key={k} className="mb-10">
          <h2 className="text-xl font-bold mb-3">{k}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {arr.map((p: any) => (
              <div key={p.id} className="relative group">
                <PhotoCard p={p} onOpen={() => { setViewIdx(filtered.indexOf(p)); setSlideshow(false); }} />
                {user?.id === p.user_id && (
                  <button onClick={() => remove(p)} className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {viewIdx !== null && filtered[viewIdx] && (
        <>
          <Lightbox photos={filtered} index={viewIdx} onClose={() => { setViewIdx(null); setSlideshow(false); }} onIndex={setViewIdx} />
          {slideshow && (
            <button onClick={() => setSlideshow(false)} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-white/10 text-white text-sm flex items-center gap-2">
              <Pause className="w-4 h-4" /> Pause slideshow
            </button>
          )}
        </>
      )}
    </div>
  );
}
