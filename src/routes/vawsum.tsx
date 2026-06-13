import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ExternalLink } from "lucide-react";

const VAWSUM_URL = "https://institution.vawsum.com/";

export const Route = createFileRoute("/vawsum")({
  component: VawsumPage,
  head: () => ({
    meta: [
      { title: "Open Vawsum — Class 8 B" },
      { name: "description", content: "Open the Vawsum school portal." },
    ],
  }),
});

function VawsumPage() {
  useEffect(() => {
    // Immediate redirect to Vawsum
    window.location.replace(VAWSUM_URL);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hero shadow-glow text-primary-foreground mb-6 animate-glow-pulse">
        <ExternalLink className="w-8 h-8" />
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        Opening <span className="text-gradient">Vawsum</span>…
      </h1>
      <p className="mt-4 text-muted-foreground">
        Redirecting you to the Vawsum school portal. If nothing happens,{" "}
        <a href={VAWSUM_URL} className="text-primary font-semibold underline">click here</a>.
      </p>
    </div>
  );
}
