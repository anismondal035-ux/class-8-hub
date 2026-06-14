import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Calendar, Printer, PartyPopper } from "lucide-react";
import { closureOn, isWeekend, entriesOn } from "@/lib/holidays";

export const Route = createFileRoute("/routine")({
  component: RoutinePage,
  head: () => ({
    meta: [
      { title: "Class Timetable — Class 8 B · DPS Barasat" },
      { name: "description", content: "Class 8-B official weekly timetable. Class Teacher: Aritri Das. Delhi Public Secondary School, Barasat." },
    ],
  }),
});

// Periods exactly as in the official timetable
const PERIODS = [
  { n: "1st", time: "9.30 – 10.10" },
  { n: "2nd", time: "10.20 – 11.00" },
  { n: "3rd", time: "11.00 – 11.40" },
  { n: "4th", time: "11.40 – 12.20" },
  { n: "5th", time: "12.20 – 1.00" },
  { n: "6th", time: "1.20 – 1.55" },
  { n: "7th", time: "1.55 – 2.30" },
  { n: "8th", time: "2.30 – 3.00" },
];

// Subjects per day in period order (slot 5 is replaced by SHORT BREAK column visually
// but the actual subject lineup is what we render; the break columns sit between).
type Cell = { s: string; span?: number };
const SCHEDULE: Record<string, Cell[]> = {
  Monday:    [{s:"Chemistry"},{s:"Computer"},{s:"Maths"},{s:"Maths"},{s:"Library"},{s:"3rd Language"},{s:"Physics"},{s:"English"}],
  Tuesday:   [{s:"Biology"},{s:"Maths"},{s:"English Skill"},{s:"2nd Language"},{s:"English"},{s:"History"},{s:"3rd Language"},{s:"P.T"}],
  Wednesday: [{s:"English"},{s:"Yoga"},{s:"Computer"},{s:"2nd Language"},{s:"Geography"},{s:"Art & Craft"},{s:"Maths"},{s:"Chemistry"}],
  Thursday:  [{s:"Biology"},{s:"Computer"},{s:"Maths"},{s:"Vocal Music"},{s:"Geography"},{s:"2nd Language"},{s:"English"},{s:"G.K. & Moral Science"}],
  Friday:    [{s:"Physics"},{s:"History"},{s:"CCA"},{s:"2nd Language"},{s:"Maths"},{s:"English"},{s:"Club", span:2}],
};

const SUBJECT_COLOR: Record<string,string> = {
  English: "bg-sky-500/20 text-sky-200 border-sky-400/30",
  Maths: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
  Physics: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
  Chemistry: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  Biology: "bg-green-500/20 text-green-200 border-green-400/30",
  Computer: "bg-violet-500/20 text-violet-200 border-violet-400/30",
  History: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  Geography: "bg-teal-500/20 text-teal-200 border-teal-400/30",
  Library: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  "2nd Language": "bg-orange-500/20 text-orange-200 border-orange-400/30",
  "3rd Language": "bg-yellow-500/20 text-yellow-200 border-yellow-400/30",
  "English Skill": "bg-blue-500/20 text-blue-200 border-blue-400/30",
  "Art & Craft": "bg-pink-500/20 text-pink-200 border-pink-400/30",
  "Vocal Music": "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30",
  "G.K. & Moral Science": "bg-lime-500/20 text-lime-200 border-lime-400/30",
  Yoga: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  "P.T": "bg-lime-500/20 text-lime-200 border-lime-400/30",
  CCA: "bg-pink-500/20 text-pink-200 border-pink-400/30",
  Club: "bg-purple-500/20 text-purple-200 border-purple-400/30",
};
function cellClass(s: string) {
  return SUBJECT_COLOR[s] ?? "bg-secondary text-foreground border-border";
}

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"] as const;

function RoutinePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Calendar className="w-3.5 h-3.5" /> Official Class Timetable
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
          Delhi Public Secondary <span className="text-gradient">School, Barasat</span>
        </h1>
        <p className="mt-2 text-base sm:text-lg">Class Timetable · <b>VIII B</b></p>
        <p className="text-sm text-muted-foreground">Class Teacher: <b className="text-foreground">Aritri Das</b></p>
        <div className="mt-5 flex justify-center gap-2 no-print">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      <div className="glass rounded-3xl p-3 sm:p-5 shadow-card-soft overflow-x-auto">
        <table className="w-full min-w-[1000px] text-xs sm:text-sm border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="p-2 text-left font-semibold text-muted-foreground">Days</th>
              {PERIODS.slice(0,5).map((p,i) => (
                <th key={i} className="p-2 text-center font-semibold text-muted-foreground">
                  <div className="text-[11px] uppercase tracking-wide text-primary">{p.n} Period</div>
                  <div className="text-[10px] text-muted-foreground font-normal">{p.time}</div>
                </th>
              ))}
              <th className="p-2 text-center font-semibold text-muted-foreground w-16">Long Break<br/><span className="font-normal text-[10px]">1.00 – 1.20</span></th>
              {PERIODS.slice(5).map((p,i) => (
                <th key={i} className="p-2 text-center font-semibold text-muted-foreground">
                  <div className="text-[11px] uppercase tracking-wide text-primary">{p.n} Period</div>
                  <div className="text-[10px] text-muted-foreground font-normal">{p.time}</div>
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              <th></th>
              <th colSpan={4} className="p-1.5 text-center text-[11px] italic text-muted-foreground bg-muted/40 rounded">Short Break: 10.10 – 10.20</th>
              <th colSpan={4}></th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const row = SCHEDULE[day];
              // first 5 periods then long-break column then remaining
              const first = row.slice(0, 5);
              // remaining cells handling span for Club row (Friday)
              const rest: Cell[] = [];
              let idx = 5;
              while (idx < row.length) { rest.push(row[idx]); idx += row[idx].span ?? 1; }
              // Pad if Friday has fewer entries due to spans (slot 5 covers 7+8 with span=2)
              return (
                <tr key={day}>
                  <td className="p-2 font-bold text-foreground whitespace-nowrap">{day}</td>
                  {first.map((c,i) => (
                    <td key={i} className="p-1 text-center">
                      <div className={`rounded-lg border px-2 py-2.5 font-medium select-text ${cellClass(c.s)}`}>{c.s}</div>
                    </td>
                  ))}
                  <td className="p-1 bg-muted/30 rounded text-center text-[10px] italic text-muted-foreground">break</td>
                  {rest.map((c,i) => (
                    <td key={i} className="p-1 text-center" colSpan={c.span ?? 1}>
                      <div className={`rounded-lg border px-2 py-2.5 font-medium select-text ${cellClass(c.s)}`}>{c.s}</div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Tap-and-hold (mobile) or click-drag (desktop) on any cell to select and copy the subject name.
      </p>
    </div>
  );
}
