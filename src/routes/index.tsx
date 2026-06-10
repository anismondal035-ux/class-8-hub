import { createFileRoute, Link } from "@tanstack/react-router";
import { Chat } from "@/components/Chat";
import { DailyContent } from "@/components/DailyContent";
import { Calendar, Download, ExternalLink, Camera, Cake, Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Class 8 B — Smart School Hub" },
      { name: "description", content: "Class 8 B official hub: AI study buddy, daily word & thought, routine, memories, birthdays and games." },
    ],
  }),
});

const QUICK = [
  { to: "/routine", label: "Routine", desc: "Weekly timetable", Icon: Calendar },
  { to: "/memories", label: "Memories", desc: "Class photos", Icon: Camera },
  { to: "/birthdays", label: "Birthdays", desc: "Never miss one", Icon: Cake },
  { to: "/funzone", label: "Fun Zone", desc: "Games & more", Icon: Gamepad2 },
  { to: "/vawsum", label: "Vawsum", desc: "School app", Icon: ExternalLink },
  { to: "/downloads", label: "Download", desc: "Get the app", Icon: Download },
];

function Index() {
  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10 sm:space-y-12">
      <section className="text-center max-w-3xl mx-auto pt-4 sm:pt-6">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-5">
          ✨ Smart school portal · 2026
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Welcome to <span className="text-gradient">Class 8 B</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground">
          Your AI study buddy, today's Word & Thought, routine, memories, birthdays, games and more — all in one place.
        </p>
      </section>

      <section className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-3">
          <Chat />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          <DailyContent />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 text-center">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK.map(({ to, label, desc, Icon }) => (
            <Link key={to} to={to} className="group glass rounded-2xl p-5 hover:scale-[1.03] transition-transform">
              <Icon className="w-6 h-6 text-primary mb-2" />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
