import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Menu, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/routine", label: "Routine" },
  { to: "/memories", label: "Memories" },
  { to: "/birthdays", label: "Birthdays" },
  { to: "/funzone", label: "Fun Zone" },
  { to: "/vawsum", label: "Vawsum" },
  { to: "/downloads", label: "Download" },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border no-print">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg shrink-0" onClick={() => setOpen(false)}>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-hero shadow-glow text-primary-foreground">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="text-gradient">Class 8 B</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeProps={{ className: "px-3.5 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-hero shadow-glow" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => setOpen((v) => !v)} className="lg:hidden p-2 rounded-lg hover:bg-secondary" aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t border-border px-4 py-3 grid grid-cols-2 gap-2 bg-background/95">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary text-center"
                activeProps={{ className: "px-3 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-hero text-center" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 animate-float-up">
        <Outlet />
      </main>

      <footer className="border-t border-border mt-12 no-print">
        <div className="max-w-[1500px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>Class 8 B · Delhi Public Secondary · Learn together, grow together.</p>
          <p className="font-semibold">
            Made with 💙 by <span className="text-gradient">Anis</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
