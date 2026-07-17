import { Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Menu, X, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/assistant", label: "AI" },
  { to: "/chat", label: "Chat" },
  { to: "/routine", label: "Timetable" },
  { to: "/homework", label: "Homework" },
  { to: "/notes", label: "Notes" },
  { to: "/daily", label: "Daily" },
  { to: "/events", label: "Events" },
  { to: "/holidays", label: "Holidays" },
  { to: "/announcements", label: "News" },
  { to: "/memories", label: "Memories" },
  { to: "/birthdays", label: "Birthdays" },
  { to: "/funzone", label: "Fun" },
  { to: "/anthems", label: "Anthems" },
  { to: "/vawsum", label: "Vawsum" },
  { to: "/downloads", label: "Download" },
];

function AuthBadge() {
  const { user, profile, signInWithGoogle, signOut, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <Button size="sm" onClick={signInWithGoogle} className="bg-hero shadow-soft-glow gap-1.5">
        <LogIn className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full border border-primary/40" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-hero text-primary-foreground flex items-center justify-center text-xs font-bold">
          {(profile?.display_name?.[0] ?? "S").toUpperCase()}
        </div>
      )}
      <button onClick={signOut} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground" title="Sign out">
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass-strong border-b border-border no-print">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg shrink-0" onClick={() => setOpen(false)}>
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-hero shadow-glow text-primary-foreground">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="text-gradient hidden sm:inline">Class 8 B</span>
          </Link>
          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeProps={{ className: "px-3 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-hero shadow-soft-glow" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AuthBadge />
            <button onClick={() => setOpen((v) => !v)} className="xl:hidden p-2 rounded-lg hover:bg-secondary" aria-label="Menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="xl:hidden border-t border-border px-4 py-3 grid grid-cols-3 sm:grid-cols-4 gap-2 bg-background/95">
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

      <footer className="border-t border-border mt-16 no-print">
        <div className="max-w-[1500px] mx-auto px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>Class 8 B · Premium student portal · 2026</p>
          <p className="font-semibold">
            Made with 💜 by <span className="text-gradient">Anis</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
