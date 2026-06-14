import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CALENDAR, TYPE_CLASS, TYPE_LABEL, entriesInMonth, entriesOn,
  nextHoliday, toISO, upcomingEntries, daysBetween, closureOn, isWeekend,
} from "@/lib/holidays";
import { Calendar, ChevronLeft, ChevronRight, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/holidays")({
  component: HolidaysPage,
  head: () => ({
    meta: [
      { title: "Holiday Calendar — Class 8 B · DPS Barasat" },
      { name: "description", content: "Official Academic Session 2026–2027 Holiday Calendar of Delhi Public Secondary School, Barasat." },
    ],
  }),
});

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function HolidaysPage() {
  const today = new Date();
  const earliest = new Date(CALENDAR[0].start + "T00:00:00");
  const latest = new Date(CALENDAR[CALENDAR.length - 1].end + "T00:00:00");

  const initial = today >= earliest && today <= latest ? today : earliest;
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

  const monthEntries = useMemo(() => entriesInMonth(view.y, view.m), [view]);
  const next = useMemo(() => nextHoliday(today), [today]);
  const upcoming = useMemo(() => upcomingEntries(8, today), [today]);
  const todayEntries = entriesOn(today);
  const todayClosure = closureOn(today);
  const weekend = isWeekend(today);

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  function shift(delta: number) {
    let m = view.m + delta;
    let y = view.y;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setView({ y, m });
  }

  const countdown = next ? daysBetween(today, new Date(next.start + "T00:00:00")) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-4">
          <Calendar className="w-3.5 h-3.5" /> Academic Session 2026–2027
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Holiday <span className="text-gradient">Calendar</span>
        </h1>
        <p className="mt-3 text-muted-foreground text-sm sm:text-base">
          Delhi Public Secondary School, Barasat · Affiliated to CBSE: 2430364
        </p>
      </header>

      {/* Today + Next holiday */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="glass-strong rounded-3xl p-6 shadow-soft-glow">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Today</span>
          </div>
          {todayClosure ? (
            <>
              <p className="text-2xl font-bold">Holiday Today 🎉</p>
              <p className="text-muted-foreground mt-1">{todayClosure.name}</p>
            </>
          ) : weekend ? (
            <>
              <p className="text-2xl font-bold">Weekend — No Classes Today 🎉</p>
              <p className="text-muted-foreground mt-1">Rest, recharge, have fun.</p>
            </>
          ) : todayEntries.length > 0 ? (
            <>
              <p className="text-2xl font-bold">{todayEntries[0].name}</p>
              <p className="text-muted-foreground mt-1">{TYPE_LABEL[todayEntries[0].type]} · classes as per schedule</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold">Regular School Day</p>
              <p className="text-muted-foreground mt-1">Classes run as per timetable.</p>
            </>
          )}
        </div>

        <div className="glass-strong rounded-3xl p-6 shadow-soft-glow">
          <div className="flex items-center gap-2 text-primary mb-2">
            <PartyPopper className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Next Holiday</span>
          </div>
          {next ? (
            <>
              <p className="text-2xl font-bold">{next.name}</p>
              <p className="text-muted-foreground mt-1">
                {new Date(next.start + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="mt-3 inline-block text-sm font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                {countdown === 0 ? "Today!" : countdown === 1 ? "Tomorrow" : `in ${countdown} days`}
              </p>
            </>
          ) : <p className="text-muted-foreground">No upcoming holidays in this academic year.</p>}
        </div>
      </section>

      {/* Month grid */}
      <section className="glass rounded-3xl p-4 sm:p-6 shadow-card-soft">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={() => shift(-1)} className="gap-1"><ChevronLeft className="w-4 h-4" /> Prev</Button>
          <h2 className="text-xl sm:text-2xl font-bold">{MONTHS[view.m]} {view.y}</h2>
          <Button variant="outline" size="sm" onClick={() => shift(1)} className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-muted-foreground mb-2">
          {DOW.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((day, i) => {
            if (day == null) return <div key={i} />;
            const d = new Date(view.y, view.m, day);
            const iso = toISO(d);
            const ents = entriesOn(d);
            const wkend = isWeekend(d);
            const isToday = iso === toISO(today);
            const closure = ents.find((e) => e.type === "holiday" || e.type === "vacation");
            const cel = ents.find((e) => e.type === "celebration");
            const exam = ents.find((e) => e.type === "exam");
            const top = closure ?? cel ?? exam ?? ents[0];
            const bg = top ? TYPE_CLASS[top.type] : wkend ? "bg-secondary/60 text-muted-foreground border-border" : "bg-card text-foreground border-border";
            return (
              <div
                key={i}
                title={ents.map((e) => `${TYPE_LABEL[e.type]}: ${e.name}`).join("\n") || (wkend ? "Weekend" : "Regular day")}
                className={`min-h-[64px] sm:min-h-[88px] rounded-lg border p-1.5 sm:p-2 text-left ${bg} ${isToday ? "ring-2 ring-primary shadow-glow" : ""}`}
              >
                <div className="text-xs sm:text-sm font-bold">{day}</div>
                {top && <div className="mt-1 text-[10px] sm:text-xs leading-tight line-clamp-2">{top.name}</div>}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(["holiday","vacation","celebration","exam","reopen"] as const).map((t) => (
            <span key={t} className={`px-2.5 py-1 rounded-full border ${TYPE_CLASS[t]}`}>{TYPE_LABEL[t]}</span>
          ))}
        </div>
      </section>

      {/* Upcoming list */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold mb-4"><span className="text-gradient">Upcoming</span> entries</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {upcoming.map((e, i) => {
            const start = new Date(e.start + "T00:00:00");
            const end = new Date(e.end + "T00:00:00");
            const same = e.start === e.end;
            const left = daysBetween(today, start);
            return (
              <div key={i} className="glass rounded-2xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full border ${TYPE_CLASS[e.type]}`}>{TYPE_LABEL[e.type]}</span>
                    <p className="font-semibold truncate">{e.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {same
                      ? start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })
                      : `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  {left <= 0 ? "Now" : left === 1 ? "Tomorrow" : `in ${left}d`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        ** The content of this calendar is subject to change in process requirements and unavoidable circumstances.
      </p>
    </div>
  );
}
