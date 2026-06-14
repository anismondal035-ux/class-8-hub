import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DailyMotivation } from "@/components/DailyMotivation";
import { closureOn, isWeekend, nextHoliday, daysBetween } from "@/lib/holidays";
import {
  Calendar, Download, Camera, Cake, Gamepad2, Bot, MessageSquare,
  BookOpen, ClipboardList, FileText, Megaphone, CalendarClock, Sparkles, ArrowRight, GraduationCap, Sun, ExternalLink,
  PartyPopper,
} from "lucide-react";


export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Class 8-B Official Website" },
      { name: "description", content: "Your all-in-one destination for studies, memories, events, games, communication, and classroom activities." },
      { property: "og:title", content: "Class 8-B Official Website" },
      { property: "og:description", content: "Your all-in-one destination for studies, memories, events, games, communication, and classroom activities." },
    ],
  }),
});

const QUICK = [
  { to: "/routine", label: "Timetable", desc: "Weekly schedule", Icon: Calendar },
  { to: "/homework", label: "Homework", desc: "Pending tasks", Icon: ClipboardList },
  { to: "/notes", label: "Notes", desc: "Shared notes", Icon: FileText },
  { to: "/daily", label: "Daily Inspiration", desc: "Word & thought", Icon: Sun },
  { to: "/holidays", label: "Holidays", desc: "Calendar", Icon: PartyPopper },
  { to: "/vawsum", label: "Vawsum", desc: "School portal", Icon: ExternalLink },
  { to: "/events", label: "Events", desc: "Upcoming", Icon: CalendarClock },
  { to: "/birthdays", label: "Birthdays", desc: "Never miss one", Icon: Cake },
  { to: "/memories", label: "Memories", desc: "Class photos", Icon: Camera },
  { to: "/funzone", label: "Games", desc: "Fun zone", Icon: Gamepad2 },
  { to: "/chat", label: "Chat", desc: "Class chat", Icon: MessageSquare },
  { to: "/assistant", label: "AI Assistant", desc: "Smart help", Icon: Bot },
  { to: "/announcements", label: "Announcements", desc: "Latest news", Icon: Megaphone },
  { to: "/downloads", label: "Download App", desc: "PC & mobile", Icon: Download },
];

function todayDOW() {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
}

const TIMETABLE: Record<string, string[]> = {
  Monday:    ["English","Maths","Science","Hindi","Bengali","Computer","Games"],
  Tuesday:   ["Maths","Science","English","Geography","Hindi","Sanskrit","Art"],
  Wednesday: ["History","English","Maths","Science","Bengali","P.E.","Library"],
  Thursday:  ["Science","Maths","English","Civics","Hindi","Computer","Music"],
  Friday:    ["English","Bengali","Maths","Science","Geography","Art","Games"],
  Saturday:  ["Maths","English","Science","Hindi","Library","Computer","Activity"],
  Sunday:    [],
};

function EssentialThings() {
  const today = todayDOW();
  const todaysClasses = TIMETABLE[today] ?? [];

  const { data: hw } = useQuery({
    queryKey: ["dash-hw"],
    queryFn: async () => {
      const { data } = await supabase.from("homework").select("*").order("due_date", { ascending: true }).limit(3);
      return data ?? [];
    },
  });
  const { data: events } = useQuery({
    queryKey: ["dash-events"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("events").select("*").gte("event_date", today).order("event_date", { ascending: true }).limit(3);
      return data ?? [];
    },
  });
  const { data: ann } = useQuery({
    queryKey: ["dash-ann"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });
  const { data: photos } = useQuery({
    queryKey: ["dash-photos"],
    queryFn: async () => {
      const { data } = await supabase.from("memory_photos").select("*").order("created_at", { ascending: false }).limit(4);
      return data ?? [];
    },
  });
  const { data: notes } = useQuery({
    queryKey: ["dash-notes"],
    queryFn: async () => {
      const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  function daysUntil(d: string) {
    const diff = Math.ceil((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
    return diff;
  }

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold"><span className="text-gradient">Essential</span> Things</h2>
        <Sparkles className="w-5 h-5 text-primary" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Classes — holiday/weekend aware */}
        <TodayCard today={today} todaysClasses={todaysClasses} />

        {/* Next Holiday */}
        <NextHolidayCard />



        {/* Upcoming Events */}
        <div className="glass rounded-3xl p-5 shadow-soft-glow">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-primary" />
            <h3 className="font-bold">Upcoming Events</h3>
          </div>
          {(events?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet. Add the next one!</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {events!.map((e: any) => {
                const d = daysUntil(e.event_date);
                return (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{e.title}</span>
                    <span className="text-xs text-primary font-semibold shrink-0">{d === 0 ? "Today" : d === 1 ? "Tomorrow" : `in ${d}d`}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link to="/events" className="text-xs text-primary mt-3 inline-flex items-center gap-1 hover:underline">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>

        {/* Homework */}
        <div className="glass rounded-3xl p-5 shadow-soft-glow">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-primary" />
            <h3 className="font-bold">Pending Homework</h3>
          </div>
          {(hw?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">All clear ✅</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {hw!.map((h: any) => (
                <li key={h.id} className="flex items-start justify-between gap-2">
                  <span className="truncate"><b className="text-primary">{h.subject}:</b> {h.title}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/homework" className="text-xs text-primary mt-3 inline-flex items-center gap-1 hover:underline">All homework <ArrowRight className="w-3 h-3" /></Link>
        </div>

        {/* Announcements */}
        <div className="glass rounded-3xl p-5 shadow-soft-glow">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4 text-primary" />
            <h3 className="font-bold">Latest Announcements</h3>
          </div>
          {(ann?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No news right now.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {ann!.map((a: any) => (
                <li key={a.id} className="truncate">{a.pinned && "📌 "}{a.title}</li>
              ))}
            </ul>
          )}
          <Link to="/announcements" className="text-xs text-primary mt-3 inline-flex items-center gap-1 hover:underline">Read all <ArrowRight className="w-3 h-3" /></Link>
        </div>

        {/* Latest Memories */}
        <div className="glass rounded-3xl p-5 shadow-soft-glow">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-primary" />
            <h3 className="font-bold">Latest Memories</h3>
          </div>
          {(photos?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No photos yet. Sign in & upload!</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {photos!.map((p: any) => (
                <img key={p.id} src={p.image_url} alt={p.caption ?? ""} className="aspect-square object-cover rounded-lg" />
              ))}
            </div>
          )}
          <Link to="/memories" className="text-xs text-primary mt-3 inline-flex items-center gap-1 hover:underline">Open album <ArrowRight className="w-3 h-3" /></Link>
        </div>

        {/* Quick Notes */}
        <div className="glass rounded-3xl p-5 shadow-soft-glow">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="font-bold">Recent Notes</h3>
          </div>
          {(notes?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {notes!.map((n: any) => (
                <li key={n.id} className="truncate"><b className="text-primary">{n.subject}:</b> {n.title}</li>
              ))}
            </ul>
          )}
          <Link to="/notes" className="text-xs text-primary mt-3 inline-flex items-center gap-1 hover:underline">All notes <ArrowRight className="w-3 h-3" /></Link>
        </div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] glass-strong shadow-glow">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-accent/30 blur-3xl animate-blob" style={{ animationDelay: "5s" }} />
        <div className="relative px-6 sm:px-12 py-14 sm:py-20 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6 animate-glow-pulse">
            <GraduationCap className="w-3.5 h-3.5" /> Welcome
          </span>
          <p className="text-sm sm:text-base uppercase tracking-[0.3em] text-muted-foreground mb-2">Delhi Public Secondary School</p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Class <span className="text-gradient">8-B</span> Official Website
          </h1>
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your all-in-one destination for <b className="text-foreground">studies, memories, events, games, communication</b> and classroom activities.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/assistant" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-hero text-primary-foreground font-semibold shadow-glow hover:scale-[1.03] transition-transform">
              <Bot className="w-4 h-4" /> Ask AI Assistant
            </Link>
            <Link to="/chat" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass border border-primary/30 font-semibold hover:bg-primary/10 transition-colors">
              <MessageSquare className="w-4 h-4" /> Open Class Chat
            </Link>
          </div>
        </div>
      </section>

      {/* DAILY MOTIVATION */}
      <DailyMotivation />

      {/* QUICK ACCESS */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold mb-5 text-center"><span className="text-gradient">Everything</span> in one place</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {QUICK.map(({ to, label, desc, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group relative overflow-hidden glass rounded-2xl p-5 hover:scale-[1.04] transition-all duration-300 hover:shadow-glow"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-hero text-primary-foreground flex items-center justify-center shadow-soft-glow mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ESSENTIAL THINGS */}
      <EssentialThings />

      {/* DOWNLOADS CTA */}
      <section className="glass-strong rounded-3xl p-8 sm:p-10 text-center shadow-card-soft">
        <Download className="w-10 h-10 text-primary mx-auto mb-3" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Get the app</h2>
        <p className="text-muted-foreground mb-5">Install Class 8-B on your phone or PC for one-tap access.</p>
        <Link to="/downloads" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-hero text-primary-foreground font-semibold shadow-glow">
          Download <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
