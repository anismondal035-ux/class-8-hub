import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Download, Monitor, Smartphone, Globe, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/downloads")({
  component: DownloadsPage,
  head: () => ({
    meta: [
      { title: "Install App — Class 8 B" },
      { name: "description", content: "Install Class 8 B as an app on Windows or Android — no store, no download, one click." },
    ],
  }),
});

function DownloadsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Download className="w-3.5 h-3.5" /> Install as app
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold">
          Install <span className="text-gradient">Class 8 B</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Get Class 8 B on your home screen — same AI buddy, daily word, routine and games — opens in its own window, no browser bar.
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
            Install <strong className="text-foreground">Class 8 B</strong> as a real Windows app — no download, no zip. Acts and feels like a Store app: own icon, own window, pinnable to taskbar.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Standalone window, no browser bar</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Pin to taskbar / Start menu</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Always up-to-date automatically</li>
          </ul>

          <ol className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">1</span>
              Open this website in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> on your PC.
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">2</span>
              Look at the address bar (top-right) — click the <strong>Install icon</strong> (a small monitor with a down arrow ⬇️).
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">3</span>
              Click <strong>"Install"</strong> in the popup. Or open the browser menu (⋮) → <strong>"Install Class 8 B"</strong>.
            </li>
          </ol>

          <p className="mt-5 text-xs text-muted-foreground">
            Once installed, it gets its own icon in the Start menu, opens in a clean window with no browser toolbar, and behaves exactly like a native Windows app. Works on the school Smart Board too.
          </p>
        </Card>

        {/* ANDROID */}
        <Card className="p-8 bg-card-gradient border-border shadow-card-soft flex flex-col">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-gradient text-accent-foreground shadow-glow mb-5">
            <Smartphone className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold">For Android</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Install <strong className="text-foreground">Class 8 B</strong> straight to your home screen — no Play Store, no APK. Acts and feels exactly like a native app: own icon, own window, full screen.
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
            Once installed, it gets its own icon, opens full-screen with no Chrome toolbar, and behaves exactly like a Play Store app.
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-6 flex items-start gap-4 bg-secondary/40 border-dashed">
        <Globe className="w-5 h-5 text-primary mt-0.5" />
        <div className="text-sm text-muted-foreground">
          The installed app always loads the live website, so every update we make here shows up in the app instantly — no re-installing needed.
        </div>
      </Card>
    </div>
  );
}
