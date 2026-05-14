import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Monitor, Smartphone, Globe, CheckCircle2, FileArchive } from "lucide-react";

export const Route = createFileRoute("/downloads")({
  component: DownloadsPage,
  head: () => ({
    meta: [
      { title: "Downloads — Class 8 B" },
      { name: "description", content: "Download the Class 8 B app for Windows or Android." },
    ],
  }),
});

const WINDOWS_URL =
  "https://tbhazlhfjrxuxljwsirv.supabase.co/storage/v1/object/public/downloads/Class8B-Windows.zip";

function DownloadsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Download className="w-3.5 h-3.5" /> Get the app
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold">
          Download <span className="text-gradient">Class 8 B</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          A real desktop app for Windows and an installable home-screen app for Android — same AI buddy, daily word and routine, no browser bar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* WINDOWS */}
        <Card className="p-8 bg-card-gradient border-border shadow-card-soft flex flex-col">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-hero text-primary-foreground shadow-glow mb-5">
            <Monitor className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold">For Windows</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A full <strong className="text-foreground">Class 8 B desktop app</strong> (Electron). Download, unzip, and double-click <code className="px-1 rounded bg-background border">Class8B.exe</code> — opens in its own window like any installed program.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Standalone window, no browser bar</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Pin to taskbar / Start menu</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> All website features inside the app</li>
          </ul>
          <a href={WINDOWS_URL} download className="mt-6 block">
            <Button size="lg" className="w-full bg-hero shadow-glow">
              <Download className="w-4 h-4 mr-2" /> Download for Windows (.zip, ~143 MB)
            </Button>
          </a>
          <div className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
            <FileArchive className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Right-click the downloaded <strong>Class8B-Windows.zip</strong> → <em>Extract All</em> → open the folder → double-click <code className="px-1 rounded bg-background border">Class8B.exe</code>. Windows SmartScreen may say "unrecognised app" — click <em>More info → Run anyway</em>.</span>
          </div>
        </Card>

        {/* ANDROID */}
        <Card className="p-8 bg-card-gradient border-border shadow-card-soft flex flex-col">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-gradient text-accent-foreground shadow-glow mb-5">
            <Smartphone className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold">For Android</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Install <strong className="text-foreground">Class 8 B</strong> straight to your home screen — no Play Store, no zip. Acts and feels exactly like a native app: own icon, own window, full screen.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Own icon on your home screen</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Opens like a normal app, no browser UI</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Same AI buddy & daily word</li>
          </ul>

          <ol className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">1</span>
              Open this website in <strong>Chrome</strong> on your Android phone.
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">2</span>
              Tap the <strong>⋮ menu</strong> (top-right).
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">3</span>
              Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </li>
          </ol>

          <p className="mt-5 text-xs text-muted-foreground">
            A signed Play-Store-style <code className="px-1 rounded bg-background border">.apk</code> needs Android Studio signing — coming next. The home-screen install above is the same experience offline-friendly users expect.
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-6 flex items-start gap-4 bg-secondary/40 border-dashed">
        <Globe className="w-5 h-5 text-primary mt-0.5" />
        <div className="text-sm text-muted-foreground">
          The Windows app loads the live website inside its own window, so every update we make here shows up in the desktop app instantly — no need to re-download.
        </div>
      </Card>
    </div>
  );
}
