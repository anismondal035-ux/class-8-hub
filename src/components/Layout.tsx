import { Link, Outlet } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/routine", label: "Routine" },
  { to: "/vawsum", label: "Vawsum" },
  { to: "/downloads", label: "Downloads" },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-hero shadow-glow text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-gradient">Class 8 B</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeProps={{ className: "px-4 py-2 rounded-lg text-sm font-semibold text-primary bg-secondary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <p>Class 8 B · Knowledge, every day.</p>
          <p className="font-semibold">
            Made by <span className="text-gradient">Anis</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
