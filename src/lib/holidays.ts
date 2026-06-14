// Official Academic Session 2026-2027 Holiday Calendar
// Delhi Public Secondary School, Barasat — CBSE: 2430364
// Source: official school calendar image uploaded by user.

export type CalendarEntryType = "holiday" | "vacation" | "celebration" | "exam" | "reopen";

export type CalendarEntry = {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD (inclusive)
  name: string;
  type: CalendarEntryType;
};

// NOTE: school operates Mon–Fri. Saturday/Sunday are weekends and are NOT
// listed here as "holiday" — they are detected automatically.
export const CALENDAR: CalendarEntry[] = [
  // April 2026
  { start: "2026-04-14", end: "2026-04-14", name: "Ambedkar Jayanti", type: "holiday" },

  // May 2026
  { start: "2026-05-01", end: "2026-05-01", name: "International Labours Day / Buddha Purnima", type: "holiday" },
  { start: "2026-05-09", end: "2026-05-09", name: "Rabindra Jayanti", type: "celebration" },
  { start: "2026-05-27", end: "2026-05-27", name: "Id-ul-Zuha / Bakri Eid", type: "holiday" },
  { start: "2026-05-16", end: "2026-05-31", name: "Summer Vacation", type: "vacation" },

  // June 2026
  { start: "2026-06-01", end: "2026-06-02", name: "Summer Vacation", type: "vacation" },
  { start: "2026-06-03", end: "2026-06-03", name: "School Re-opens", type: "reopen" },
  { start: "2026-06-15", end: "2026-06-25", name: "PT-1 Examination (LKG to Class XII)", type: "exam" },
  { start: "2026-06-26", end: "2026-06-26", name: "Muharram", type: "holiday" },

  // July 2026
  { start: "2026-07-16", end: "2026-07-16", name: "Rath-Yatra", type: "holiday" },

  // August 2026
  { start: "2026-08-15", end: "2026-08-15", name: "Independence Day", type: "celebration" },
  { start: "2026-08-26", end: "2026-08-26", name: "Milad-un-Nabi", type: "holiday" },

  // September 2026
  { start: "2026-09-04", end: "2026-09-04", name: "Janmashtami", type: "holiday" },
  { start: "2026-09-05", end: "2026-09-05", name: "Teachers' Day", type: "celebration" },
  { start: "2026-09-18", end: "2026-09-18", name: "Vishwakarma Puja", type: "holiday" },
  { start: "2026-09-15", end: "2026-09-30", name: "Half-Yearly Examination (LKG to Class XII)", type: "exam" },

  // October 2026
  { start: "2026-10-02", end: "2026-10-02", name: "Gandhi Jayanti", type: "holiday" },
  { start: "2026-10-10", end: "2026-10-10", name: "Mahalaya", type: "holiday" },
  { start: "2026-10-16", end: "2026-10-25", name: "Puja Vacation", type: "vacation" },
  { start: "2026-10-26", end: "2026-10-26", name: "School Re-opens", type: "reopen" },

  // November 2026
  { start: "2026-11-07", end: "2026-11-11", name: "Diwali Vacation", type: "vacation" },
  { start: "2026-11-12", end: "2026-11-12", name: "School Re-opens", type: "reopen" },
  { start: "2026-11-14", end: "2026-11-14", name: "Children's Day", type: "celebration" },
  { start: "2026-11-24", end: "2026-11-24", name: "Guru Nanak Jayanti", type: "holiday" },
  { start: "2026-11-16", end: "2026-11-23", name: "PT-2 Examination (LKG to Class IX and XI)", type: "exam" },

  // December 2026
  { start: "2026-12-10", end: "2026-12-24", name: "Pre-Board Examination (Class X and XII)", type: "exam" },
  { start: "2026-12-25", end: "2026-12-31", name: "Winter Vacation", type: "vacation" },

  // January 2027
  { start: "2027-01-01", end: "2027-01-01", name: "Winter Vacation", type: "vacation" },
  { start: "2027-01-02", end: "2027-01-02", name: "School Re-opens", type: "reopen" },
  { start: "2027-01-12", end: "2027-01-12", name: "Vivekananda Birthday", type: "holiday" },
  { start: "2027-01-23", end: "2027-01-23", name: "Netaji Jayanti", type: "celebration" },
  { start: "2027-01-26", end: "2027-01-26", name: "Republic Day", type: "celebration" },

  // February 2027
  { start: "2027-02-11", end: "2027-02-11", name: "Saraswati Puja / Vasant Panchami", type: "celebration" },
  { start: "2027-02-13", end: "2027-03-15", name: "Annual Examination (LKG to Class IX and XI)", type: "exam" },

  // March 2027
  { start: "2027-03-06", end: "2027-03-06", name: "Maha Shivratri", type: "holiday" },
  { start: "2027-03-10", end: "2027-03-10", name: "Id-ul-Fitr", type: "holiday" },
  { start: "2027-03-22", end: "2027-03-22", name: "Holi / Dol Purnima", type: "holiday" },
];

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function entriesOn(d: Date): CalendarEntry[] {
  const iso = toISO(d);
  return CALENDAR.filter((e) => iso >= e.start && iso <= e.end);
}

// Closures: holiday + vacation (school is closed). Celebrations/exams/reopens
// are NOT closures (classes still happen / a school event happens).
export function closureOn(d: Date): CalendarEntry | null {
  return entriesOn(d).find((e) => e.type === "holiday" || e.type === "vacation") ?? null;
}

export function nextHoliday(from: Date = new Date()): CalendarEntry | null {
  const iso = toISO(from);
  const upcoming = CALENDAR
    .filter((e) => (e.type === "holiday" || e.type === "vacation") && e.start >= iso)
    .sort((a, b) => a.start.localeCompare(b.start));
  return upcoming[0] ?? null;
}

export function upcomingEntries(limit = 6, from: Date = new Date()): CalendarEntry[] {
  const iso = toISO(from);
  return CALENDAR
    .filter((e) => e.end >= iso)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, limit);
}

export function daysBetween(a: Date, b: Date): number {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((B - A) / 86400000);
}

export function entriesInMonth(year: number, month: number): CalendarEntry[] {
  // month: 0-indexed
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstISO = toISO(first);
  const lastISO = toISO(last);
  return CALENDAR.filter((e) => !(e.end < firstISO || e.start > lastISO));
}

export const TYPE_LABEL: Record<CalendarEntryType, string> = {
  holiday: "Holiday",
  vacation: "Vacation",
  celebration: "Celebration",
  exam: "Examination",
  reopen: "School Re-opens",
};

export const TYPE_CLASS: Record<CalendarEntryType, string> = {
  holiday: "bg-rose-500/20 text-rose-200 border-rose-400/30",
  vacation: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  celebration: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  exam: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
  reopen: "bg-sky-500/20 text-sky-200 border-sky-400/30",
};
