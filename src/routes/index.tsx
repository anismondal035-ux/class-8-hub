import { createFileRoute, Link } from "@tanstack/react-router";
import { Chat } from "@/components/Chat";
import { DailyContent } from "@/components/DailyContent";
import { Calendar, Download, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Class 8 B — Home" },
      { name: "description", content: "Class 8 B home: AI buddy, daily word and thought for assembly, and more." },
    ],
  }),
});

function Index() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12">
      <section className="text-center max-w-3xl mx-auto pt-6">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-5">
          ✨ Built for the smartboard
        </p>
        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
          Welcome to <span className="text-gradient">Class 8 B</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Your AI study buddy, today's Word & Thought for assembly, your routine and your school links — all in one place.
        </p>
      </section>

      <section className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Chat />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <DailyContent />
          <div className="grid sm:grid-cols-3 gap-3">
            <Link to="/routine" className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
              <Calendar className="w-5 h-5 text-primary mb-2" />
              <p className="font-semibold text-sm">Class Routine</p>
              <p className="text-xs text-muted-foreground mt-1">View & zoom</p>
            </Link>
            <Link to="/vawsum" className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
              <ExternalLink className="w-5 h-5 text-primary mb-2" />
              <p className="font-semibold text-sm">Open Vawsum</p>
              <p className="text-xs text-muted-foreground mt-1">School app</p>
            </Link>
            <Link to="/downloads" className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
              <Download className="w-5 h-5 text-primary mb-2" />
              <p className="font-semibold text-sm">Downloads</p>
              <p className="text-xs text-muted-foreground mt-1">Windows & Android</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
