import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Calendar, Printer } from "lucide-react";

export const Route = createFileRoute("/routine")({
  component: RoutinePage,
  head: () => ({
    meta: [
      { title: "Class Routine — Class 8 B" },
      { name: "description", content: "Class 8 B weekly timetable. Color-coded, copyable, printable." },
    ],
  }),
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = ["1", "2", "3", "4", "5", "6", "7", "8"];

// Edit any cell here — pure data, fully copyable.
const SCHEDULE: Record<string, string[]> = {
  Monday:    ["English", "Maths", "Science", "BREAK", "History", "Geography", "Bengali", "Computer"],
  Tuesday:   ["Maths", "English", "Hindi", "BREAK", "Science", "Art", "PE", "Library"],
  Wednesday: ["Science", "Maths", "English", "BREAK", "Bengali", "History", "Geography", "Music"],
  Thursday:  ["English", "Science", "Maths", "BREAK", "Computer", "Hindi", "Civics", "PE"],
  Friday:    ["Maths", "Bengali", "English", "BREAK", "Science", "Geography", "Art", "History"],
  Saturday:  ["Assembly", "English", "Maths", "BREAK", "Science", "Sports", "Club", "—"],
};

const SUBJECT_COLORS: Record<string, string> = {
  English: "bg-sky-500/20 text-sky-200 border-sky-400/30",
  Maths: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
  Science: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  History: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  Geography: "bg-teal-500/20 text-teal-200 border-teal-400/30",
  Bengali: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  Hindi: "bg-orange-500/20 text-orange-200 border-orange-400/30",
  Computer: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
  Art: "bg-pink-500/20 text-pink-200 border-pink-400/30",
  Music: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30",
  PE: "bg-lime-500/20 text-lime-200 border-lime-400/30",
  Sports: "bg-lime-500/20 text-lime-200 border-lime-400/30",
  Library: "bg-violet-500/20 text-violet-200 border-violet-400/30",
  Civics: "bg-yellow-500/20 text-yellow-200 border-yellow-400/30",
  Club: "bg-purple-500/20 text-purple-200 border-purple-400/30",
  Assembly: "bg-blue-500/20 text-blue-200 border-blue-400/30",
  BREAK: "bg-muted text-muted-foreground border-border italic",
  "—": "bg-muted/50 text-muted-foreground border-border",
};

function cellClass(subject: string) {
  return SUBJECT_COLORS[subject] ?? "bg-secondary text-foreground border-border";
}

function RoutinePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Calendar className="w-3.5 h-3.5" /> Weekly schedule
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold">
          Class <span className="text-gradient">Routine</span>
        </h1>
        <p className="mt-3 text-muted-foreground">Color-coded by subject · Copyable text · Print-ready</p>
        <div className="mt-5 flex justify-center gap-2 no-print">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print routine
          </Button>
        </div>
      </div>

      <div className="glass rounded-3xl p-3 sm:p-5 shadow-card-soft overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left font-semibold text-muted-foreground">Day / Period</th>
              {PERIODS.map((p) => (
                <th key={p} className="p-3 text-center font-semibold text-muted-foreground">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="border-t border-border">
                <td className="p-3 font-bold text-foreground whitespace-nowrap">{day}</td>
                {SCHEDULE[day].map((subj, i) => (
                  <td key={i} className="p-1.5 text-center">
                    <div className={`rounded-lg border px-2 py-2.5 font-medium select-text ${cellClass(subj)}`}>
                      {subj}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Class Teacher: <span className="text-foreground font-semibold">Aritri Das</span> · Delhi Public Secondary · Class VIII B
      </p>
    </div>
  );
}
