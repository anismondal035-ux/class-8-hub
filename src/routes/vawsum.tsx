import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShieldCheck } from "lucide-react";

const VAWSUM_URL = "https://share.google/k8OFyibzJM0ke1nfY";

export const Route = createFileRoute("/vawsum")({
  component: VawsumPage,
  head: () => ({
    meta: [
      { title: "Open Vawsum — Class 8 B" },
      { name: "description", content: "Open the Vawsum school app login page." },
    ],
  }),
});

function VawsumPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hero shadow-glow text-primary-foreground mb-6">
        <ExternalLink className="w-8 h-8" />
      </span>
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
        Open <span className="text-gradient">Vawsum</span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Vawsum is our school's official app. Click below to open the login page in a new tab.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="h-12 px-8 bg-hero shadow-glow text-base">
          <a href={VAWSUM_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-5 h-5 mr-2" /> Open Vawsum Login
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
          <a href={VAWSUM_URL} target="_blank" rel="noopener noreferrer">Copy / share link</a>
        </Button>
      </div>

      <div className="mt-10 p-5 rounded-2xl bg-secondary border border-border text-left max-w-xl mx-auto">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            Use your school-provided Vawsum credentials. If you can't log in, ask your class teacher to reset your password.
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground break-all">{VAWSUM_URL}</p>
    </div>
  );
}
