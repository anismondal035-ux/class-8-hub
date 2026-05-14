import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Monitor, Smartphone, Globe, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/downloads")({
  component: DownloadsPage,
  head: () => ({
    meta: [
      { title: "Downloads — Class 8 B" },
      { name: "description", content: "Download the Class 8 B app for Windows or Android." },
    ],
  }),
});

function DownloadsPage() {
  const handleWindows = () => {
    toast.info("Windows installer coming soon", {
      description: "For now, install this site as a Windows app: open in Edge/Chrome → menu → 'Install Class 8 B'.",
    });
  };
  const handleAndroid = () => {
    toast.info("Android APK coming soon", {
      description: "For now, install this site as an Android app: open in Chrome → menu → 'Add to Home screen'.",
    });
  };

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
          Install Class 8 B on your computer or phone — opens like a real app, no browser bar, works offline-friendly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 bg-card-gradient border-border shadow-card-soft">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-hero text-primary-foreground shadow-glow mb-5">
            <Monitor className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold">For Windows</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Installs as <strong className="text-foreground">Class 8 App</strong>. Same features as the website, opens with one click from your desktop.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Standalone window, no browser bar</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Pin to taskbar / Start menu</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Auto-updates with the site</li>
          </ul>
          <Button onClick={handleWindows} size="lg" className="mt-6 w-full bg-hero shadow-glow">
            <Download className="w-4 h-4 mr-2" /> Download installer (.exe)
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: in Microsoft Edge or Chrome, click the address-bar install icon to install instantly.
          </p>
        </Card>

        <Card className="p-8 bg-card-gradient border-border shadow-card-soft">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-gradient text-accent-foreground shadow-glow mb-5">
            <Smartphone className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold">For Android</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Installs the <strong className="text-foreground">Class 8 App</strong> straight to your home screen — no Play Store needed.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Opens like a normal app</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Same AI buddy & daily word</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" /> Lightweight, fast</li>
          </ul>
          <Button onClick={handleAndroid} size="lg" variant="secondary" className="mt-6 w-full">
            <Download className="w-4 h-4 mr-2" /> Download APK
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: in Chrome on Android, open menu → "Add to Home screen" to install instantly.
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-6 flex items-start gap-4 bg-secondary/40 border-dashed">
        <Globe className="w-5 h-5 text-primary mt-0.5" />
        <div className="text-sm text-muted-foreground">
          The Windows installer (<code className="px-1 rounded bg-background border">.exe</code>) and Android APK are being packaged. Until then, both buttons above will guide you to install this site as a real app on your device — it behaves exactly the same as the website without needing to type the URL.
        </div>
      </Card>
    </div>
  );
}
