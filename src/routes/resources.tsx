import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Library, Search, Bookmark, BookmarkCheck, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/resources")({
  component: ResourcesPage,
  head: () => ({
    meta: [
      { title: "Student Resources — Class 8 B" },
      { name: "description", content: "Curated study resources, NCERT links, YouTube playlists, and bookmarks for Class 8 B." },
    ],
  }),
});

type Resource = { id: string; subject: string; title: string; url: string; kind: "video" | "site" | "doc" | "playlist"; description?: string; custom?: boolean };

const BUILTIN: Resource[] = [
  // NCERT / Government
  { id: "ncert-portal", subject: "All Subjects", title: "NCERT Official Textbooks (Class 8)", url: "https://ncert.nic.in/textbook.php", kind: "site", description: "Free official NCERT textbooks for every Class 8 subject." },
  { id: "diksha", subject: "All Subjects", title: "DIKSHA — Govt. of India Learning Portal", url: "https://diksha.gov.in/", kind: "site", description: "Free interactive lessons, quizzes and videos aligned with CBSE." },
  // Maths
  { id: "khan-maths-8", subject: "Maths", title: "Khan Academy — Class 8 Maths", url: "https://www.khanacademy.org/math/cbse-class-8th", kind: "playlist", description: "Step-by-step videos & practice for the full CBSE Class 8 syllabus." },
  { id: "byjus-maths", subject: "Maths", title: "BYJU'S — Maths Concepts", url: "https://byjus.com/cbse/cbse-class-8-maths/", kind: "site" },
  // Science
  { id: "khan-sci-8", subject: "Science", title: "Khan Academy — Class 8 Science", url: "https://www.khanacademy.org/science/in-in-class-8th-physics-india", kind: "playlist" },
  { id: "lh-physics", subject: "Physics", title: "LearnoHub Physics Class 8", url: "https://www.learnohub.com/Study-Material/CBSE-Class-8/Physics", kind: "site" },
  // English
  { id: "bbc-grammar", subject: "English", title: "BBC Learning English Grammar", url: "https://www.bbc.co.uk/learningenglish/english/course/lower-intermediate", kind: "playlist" },
  // History/Geo
  { id: "ncert-history", subject: "History", title: "NCERT — Our Pasts III (Class 8 History)", url: "https://ncert.nic.in/textbook.php?hess3=0-12", kind: "doc" },
  { id: "ncert-geo", subject: "Geography", title: "NCERT — Resources & Development (Class 8 Geography)", url: "https://ncert.nic.in/textbook.php?hess4=0-6", kind: "doc" },
  // Computer
  { id: "code-org", subject: "Computer", title: "Code.org — Intro to Computer Science", url: "https://code.org/student", kind: "site" },
  { id: "scratch", subject: "Computer", title: "Scratch — Build & Share Projects", url: "https://scratch.mit.edu/", kind: "site" },
  // Hindi / Bengali / 2nd & 3rd Language
  { id: "ncert-hindi", subject: "Hindi", title: "NCERT — वसंत भाग 3 (Class 8 Hindi)", url: "https://ncert.nic.in/textbook.php?hhvs1=0-18", kind: "doc" },
  { id: "ncert-bengali", subject: "Bengali", title: "WB Class 8 Bengali Resources", url: "https://wbbse.wb.gov.in/", kind: "site" },
  // GK / Moral
  { id: "natgeo-kids", subject: "G.K. & Moral Science", title: "National Geographic Kids", url: "https://kids.nationalgeographic.com/", kind: "site" },
];

const SUBJECTS = ["All", ...Array.from(new Set(BUILTIN.map(r => r.subject)))];

const BOOKMARK_KEY = "class8b-bookmarks-v1";
const CUSTOM_KEY = "class8b-resources-custom-v1";

function loadJSON<T>(k: string, fb: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; }
}
function saveJSON(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [custom, setCustom] = useState<Resource[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showOnlyMarked, setShowOnlyMarked] = useState(false);

  useEffect(() => {
    setBookmarks(loadJSON<string[]>(BOOKMARK_KEY, []));
    setCustom(loadJSON<Resource[]>(CUSTOM_KEY, []));
  }, []);

  const all = useMemo(() => [...custom, ...BUILTIN], [custom]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(r => {
      if (subject !== "All" && r.subject !== subject) return false;
      if (showOnlyMarked && !bookmarks.includes(r.id)) return false;
      if (!q) return true;
      return `${r.title} ${r.subject} ${r.description ?? ""}`.toLowerCase().includes(q);
    });
  }, [all, search, subject, bookmarks, showOnlyMarked]);

  function toggleBookmark(id: string) {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveJSON(BOOKMARK_KEY, next);
      return next;
    });
  }
  function addCustom(r: Omit<Resource, "id" | "custom">) {
    const next: Resource = { ...r, id: `c-${Date.now()}`, custom: true };
    const updated = [next, ...custom];
    setCustom(updated); saveJSON(CUSTOM_KEY, updated);
    setShowAdd(false); toast.success("Resource saved");
  }
  function removeCustom(id: string) {
    const updated = custom.filter(r => r.id !== id);
    setCustom(updated); saveJSON(CUSTOM_KEY, updated);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-4">
          <Library className="w-3.5 h-3.5" /> Study Hub
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold"><span className="text-gradient">Student</span> Resources</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
          Hand-picked educational links — NCERT, Khan Academy, science playlists and more. Bookmark your favorites and save your own study links.
        </p>
      </div>

      <div className="glass rounded-3xl p-4 mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 flex items-center gap-2 px-3 rounded-xl bg-secondary">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources…" className="border-0 bg-transparent focus-visible:ring-0 h-10 px-0" />
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-secondary rounded-xl px-3 h-10 text-sm border border-border">
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button variant={showOnlyMarked ? "default" : "outline"} onClick={() => setShowOnlyMarked(v => !v)}>
          <Bookmark className="w-4 h-4 mr-1.5" /> {showOnlyMarked ? "All" : "Bookmarked"}
        </Button>
        <Button onClick={() => setShowAdd(v => !v)} className="bg-hero shadow-soft-glow"><Plus className="w-4 h-4 mr-1.5" /> Add</Button>
      </div>

      {showAdd && (
        <AddResource onCancel={() => setShowAdd(false)} onSave={addCustom} />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 glass rounded-3xl p-10 text-center text-muted-foreground">
            No resources match. Try a different search or subject.
          </div>
        )}
        {filtered.map(r => (
          <div key={r.id} className="glass rounded-2xl p-5 flex flex-col group hover:scale-[1.01] transition-transform">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">{r.subject}</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{r.kind}</span>
              <button onClick={() => toggleBookmark(r.id)} className="ml-auto text-muted-foreground hover:text-primary">
                {bookmarks.includes(r.id) ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
            <h3 className="font-bold leading-snug">{r.title}</h3>
            {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
            <div className="mt-auto pt-4 flex items-center justify-between">
              <a href={r.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                Open <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {r.custom && (
                <button onClick={() => removeCustom(r.id)} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Bookmarks and your saved links are stored on this device. Only add links you have permission to share.
      </p>
    </div>
  );
}

function AddResource({ onCancel, onSave }: { onCancel: () => void; onSave: (r: Omit<Resource, "id" | "custom">) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("Maths");
  const [kind, setKind] = useState<Resource["kind"]>("site");
  const [description, setDescription] = useState("");

  function save() {
    if (!title.trim() || !url.trim()) { toast.error("Title and URL are required"); return; }
    try { new URL(url); } catch { toast.error("Please enter a valid URL (including https://)"); return; }
    onSave({ title: title.trim(), url: url.trim(), subject, kind, description: description.trim() || undefined });
  }

  return (
    <div className="glass-strong rounded-3xl p-5 mb-5 grid sm:grid-cols-2 gap-3">
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
      <select value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-secondary rounded-md px-3 h-10 text-sm border border-border">
        {SUBJECTS.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={kind} onChange={(e) => setKind(e.target.value as Resource["kind"])} className="bg-secondary rounded-md px-3 h-10 text-sm border border-border">
        <option value="site">Website</option>
        <option value="video">Video</option>
        <option value="playlist">Playlist</option>
        <option value="doc">Document / PDF</option>
      </select>
      <Input placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-2" />
      <div className="flex gap-2 sm:col-span-2">
        <Button onClick={save} className="bg-hero shadow-soft-glow flex-1">Save resource</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
