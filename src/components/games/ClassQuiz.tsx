import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QUIZ_BANK, type QuizQ } from "@/lib/quiz-bank";
import {
  Trophy, Plus, X, Play, RefreshCw, SkipForward, Eye, Check, XCircle,
  Users, Award, Download, Maximize2, Minimize2, Pause, Sparkles,
} from "lucide-react";

type Team = { id: string; name: string; score: number };
type Phase = "setup" | "playing" | "finished";

const DEFAULT_TEAMS = ["Team 1", "Team 2", "Team 3", "Team 4"];
const RECENT_KEY = "quiz-recent-qs";
const RECENT_MAX = 60;

function loadRecent(): number[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(list: number[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(-RECENT_MAX)));
}

function pickNextQuestion(recent: number[]): { idx: number; q: QuizQ } {
  const set = new Set(recent);
  const pool = QUIZ_BANK.map((_, i) => i).filter((i) => !set.has(i));
  const bag = pool.length > 0 ? pool : QUIZ_BANK.map((_, i) => i);
  const idx = bag[Math.floor(Math.random() * bag.length)];
  return { idx, q: QUIZ_BANK[idx] };
}

export function ClassQuiz() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [teams, setTeams] = useState<Team[]>(
    DEFAULT_TEAMS.slice(0, 2).map((n, i) => ({ id: `t${i}`, name: n, score: 0 }))
  );
  const [turn, setTurn] = useState(0);
  const [current, setCurrent] = useState<{ idx: number; q: QuizQ } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [asked, setAsked] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const recent = useRef<number[]>(loadRecent());

  function addTeam() {
    if (teams.length >= 8) return;
    setTeams((t) => [...t, { id: `t${Date.now()}`, name: `Team ${t.length + 1}`, score: 0 }]);
  }
  function removeTeam(id: string) {
    if (teams.length <= 2) return;
    setTeams((t) => t.filter((x) => x.id !== id));
  }
  function renameTeam(id: string, name: string) {
    setTeams((t) => t.map((x) => (x.id === id ? { ...x, name } : x)));
  }
  function adjust(id: string, delta: number) {
    setTeams((t) => t.map((x) => (x.id === id ? { ...x, score: x.score + delta } : x)));
  }

  function startGame() {
    setTeams((t) => t.map((x) => ({ ...x, score: 0 })));
    setTurn(0);
    setAsked(0);
    setPhase("playing");
    nextQuestion();
  }

  function nextQuestion() {
    const pick = pickNextQuestion(recent.current);
    recent.current = [...recent.current, pick.idx];
    saveRecent(recent.current);
    setCurrent(pick);
    setRevealed(false);
  }

  function advanceTurn() {
    setTurn((t) => (t + 1) % teams.length);
    setAsked((n) => n + 1);
    nextQuestion();
  }

  function markCorrect() {
    if (!current) return;
    adjust(teams[turn].id, 1);
    advanceTurn();
  }
  function markWrong() { advanceTurn(); }
  function skip() { advanceTurn(); }

  function endGame() {
    setPhase("finished");
    setConfetti(true);
    setTimeout(() => setConfetti(false), 8000);
  }

  function newGame() {
    setPhase("setup");
    setCurrent(null);
    setRevealed(false);
    setAsked(0);
  }

  async function toggleFullscreen() {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) { await el.requestFullscreen(); setFullscreen(true); }
      else { await document.exitFullscreen(); setFullscreen(false); }
    } catch { /* ignore */ }
  }
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts for smartboard
  useEffect(() => {
    if (phase !== "playing" || paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key.toLowerCase() === "r") { e.preventDefault(); setRevealed(true); }
      else if (e.key === "1" || e.key.toLowerCase() === "c") { markCorrect(); }
      else if (e.key === "2" || e.key.toLowerCase() === "w") { markWrong(); }
      else if (e.key.toLowerCase() === "s") { skip(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, turn, current]);

  const sorted = useMemo(() => [...teams].sort((a, b) => b.score - a.score), [teams]);
  const winner = sorted[0];
  const runner = sorted[1];

  function exportResults() {
    const lines = [
      `Class 8 B — Quiz Competition Results`,
      `Date: ${new Date().toLocaleString("en-GB")}`,
      `Questions asked: ${asked}`,
      ``,
      `Final Scoreboard:`,
      ...sorted.map((t, i) => `${i + 1}. ${t.name} — ${t.score} pts`),
      ``,
      winner ? `🏆 Winner: ${winner.name} (${winner.score} pts)` : "",
      runner ? `🥈 Runner-up: ${runner.name} (${runner.score} pts)` : "",
    ].filter(Boolean).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class8b-quiz-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div ref={rootRef} className="relative bg-background text-foreground rounded-3xl overflow-hidden">
      {confetti && <Confetti />}

      {/* SETUP */}
      {phase === "setup" && (
        <div className="glass rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Smart Board Ready
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold"><span className="text-gradient">Class Quiz Competition</span></h2>
            <p className="text-muted-foreground mt-2">Add teams, then hit Start. Perfect for the classroom projector.</p>
          </div>

          <div className="space-y-3 mb-6">
            {teams.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 bg-secondary/60 rounded-xl p-3">
                <div className="w-9 h-9 rounded-lg bg-hero flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {i + 1}
                </div>
                <input
                  value={t.name}
                  onChange={(e) => renameTeam(t.id, e.target.value)}
                  className="flex-1 bg-background/60 border border-border rounded-lg px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={`Team ${i + 1}`}
                />
                <Button variant="ghost" size="sm" onClick={() => removeTeam(t.id)} disabled={teams.length <= 2}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={addTeam} disabled={teams.length >= 8}>
              <Plus className="w-4 h-4 mr-1.5" /> Add team
            </Button>
            <Button size="lg" onClick={startGame} className="bg-hero shadow-glow">
              <Play className="w-5 h-5 mr-2" /> Start Quiz
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {QUIZ_BANK.length}+ questions · Random order · Recent ones skipped · Full-screen supported
          </p>
        </div>
      )}

      {/* PLAYING */}
      {phase === "playing" && current && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px] p-2 sm:p-4">
          {/* Question panel */}
          <div className="glass rounded-3xl p-6 sm:p-10 min-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/15 text-primary font-bold">Q {asked + 1}</span>
                {current.q.cat && <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">{current.q.cat}</span>}
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>
                  {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current Team</div>
              <div className="inline-flex items-center gap-3 bg-hero text-primary-foreground px-5 py-3 rounded-2xl shadow-glow">
                <Users className="w-5 h-5" />
                <span className="text-2xl sm:text-3xl font-bold">{teams[turn].name}</span>
              </div>
            </div>

            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-8 flex-1">
              {current.q.q}
            </h3>

            <div className="grid gap-3 sm:gap-4 mb-6">
              {current.q.opts.map((opt, i) => {
                const correct = i === current.q.a;
                const highlight = revealed && correct;
                return (
                  <div
                    key={i}
                    className={`rounded-2xl border-2 p-4 sm:p-5 text-lg sm:text-2xl font-semibold flex items-center gap-4 transition-all ${
                      highlight
                        ? "bg-primary/20 border-primary shadow-glow scale-[1.01]"
                        : "bg-secondary/60 border-border"
                    }`}
                  >
                    <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      highlight ? "bg-primary text-primary-foreground" : "bg-background"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {highlight && <Check className="w-7 h-7 text-primary" />}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-auto">
              <Button size="lg" variant="outline" onClick={() => setRevealed(true)} disabled={revealed} className="h-14 sm:h-16 text-sm sm:text-base">
                <Eye className="w-5 h-5 mr-1.5" /> Reveal
              </Button>
              <Button size="lg" onClick={markCorrect} className="h-14 sm:h-16 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-5 h-5 mr-1.5" /> Correct
              </Button>
              <Button size="lg" onClick={markWrong} className="h-14 sm:h-16 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white">
                <XCircle className="w-5 h-5 mr-1.5" /> Wrong
              </Button>
              <Button size="lg" variant="outline" onClick={skip} className="h-14 sm:h-16 text-sm sm:text-base">
                <SkipForward className="w-5 h-5 mr-1.5" /> Skip
              </Button>
            </div>

            <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
              <span>Shortcuts: Space = Reveal · 1 = Correct · 2 = Wrong · S = Skip</span>
              <Button variant="ghost" size="sm" onClick={endGame}><Award className="w-4 h-4 mr-1.5" /> End Quiz</Button>
            </div>
          </div>

          {/* Scoreboard */}
          <div className="glass rounded-3xl p-5 sm:p-6 h-fit lg:sticky lg:top-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Live Scoreboard</h3>
            </div>
            <div className="space-y-3">
              {sorted.map((t, i) => (
                <div key={t.id} className={`rounded-xl p-3 border-2 ${
                  t.id === teams[turn].id ? "border-primary bg-primary/10 shadow-soft-glow" : "border-border bg-secondary/40"
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <span className="font-semibold truncate">{t.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-primary tabular-nums">{t.score}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button onClick={() => adjust(t.id, 1)} className="text-xs font-bold bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded py-1">+1</button>
                    <button onClick={() => adjust(t.id, 2)} className="text-xs font-bold bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded py-1">+2</button>
                    <button onClick={() => adjust(t.id, -1)} className="text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded py-1">-1</button>
                    <button onClick={() => adjust(t.id, -2)} className="text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded py-1">-2</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              Questions asked: <strong className="text-foreground">{asked}</strong>
            </div>
          </div>
        </div>
      )}

      {/* FINISHED */}
      {phase === "finished" && (
        <div className="glass rounded-3xl p-8 max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-3 animate-float-up">🏆</div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-2"><span className="text-gradient">Final Results</span></h2>
          <p className="text-muted-foreground mb-8">{asked} question{asked !== 1 ? "s" : ""} asked</p>

          {winner && (
            <div className="mb-6 p-6 rounded-3xl bg-hero text-primary-foreground shadow-glow animate-float-up">
              <div className="text-xs uppercase tracking-widest opacity-80 mb-1">🏆 Winner</div>
              <div className="text-4xl sm:text-5xl font-bold mb-2">{winner.name}</div>
              <div className="text-2xl font-bold">{winner.score} points</div>
            </div>
          )}
          {runner && (
            <div className="mb-6 p-4 rounded-2xl bg-secondary/80 border border-border">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">🥈 Runner-up</div>
              <div className="text-2xl font-bold">{runner.name}</div>
              <div className="text-lg text-primary font-semibold">{runner.score} points</div>
            </div>
          )}

          <div className="space-y-2 mb-6 max-w-md mx-auto text-left">
            {sorted.map((t, i) => (
              <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-secondary/60">
                <span className="font-semibold"><span className="text-muted-foreground mr-2">#{i + 1}</span>{t.name}</span>
                <span className="font-bold text-primary text-lg">{t.score}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={exportResults}><Download className="w-4 h-4 mr-1.5" /> Export</Button>
            <Button variant="outline" onClick={newGame}><RefreshCw className="w-4 h-4 mr-1.5" /> New Game</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 80 });
  const colors = ["#a855f7", "#7c3aed", "#38bdf8", "#fbbf24", "#f472b6", "#4ade80"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 3 + Math.random() * 3;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 8;
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              top: "-20px",
              width: size,
              height: size * 1.6,
              background: color,
              animation: `confetti-fall ${duration}s ${delay}s linear forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
            className="absolute rounded-sm"
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
