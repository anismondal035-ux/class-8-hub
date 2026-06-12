import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, RotateCcw, Trophy } from "lucide-react";
import { FlappyBird } from "@/components/games/FlappyBird";
import { TruthOrDare } from "@/components/games/TruthOrDare";

export const Route = createFileRoute("/funzone")({
  component: FunZone,
  head: () => ({
    meta: [
      { title: "Fun Zone — Class 8 B" },
      { name: "description", content: "Mini games for break time: Flappy Bird, Tic Tac Toe, Memory, Rock Paper Scissors, Truth or Dare." },
    ],
  }),
});

type GameId = "menu" | "flappy" | "ttt" | "rps" | "guess" | "memory" | "tod";

function FunZone() {
  const [game, setGame] = useState<GameId>("menu");

  const GAMES: { id: Exclude<GameId, "menu">; name: string; desc: string; emoji: string }[] = [
    { id: "flappy", name: "Flappy Bird", desc: "Beat your high score", emoji: "🐦" },
    { id: "tod", name: "Truth or Dare", desc: "Solo or party mode", emoji: "🎭" },
    { id: "ttt", name: "Tic Tac Toe", desc: "Classic 2-player", emoji: "❌⭕" },
    { id: "rps", name: "Rock Paper Scissors", desc: "Beat the computer", emoji: "✊✋✌️" },
    { id: "guess", name: "Number Guess", desc: "Find the secret number", emoji: "🎯" },
    { id: "memory", name: "Memory Match", desc: "Find the pairs", emoji: "🧠" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-secondary px-3 py-1.5 rounded-full mb-4">
          <Gamepad2 className="w-3.5 h-3.5" /> Break time
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold"><span className="text-gradient">Fun Zone</span></h1>
        <p className="mt-3 text-muted-foreground">Quick games for the lunch break.</p>
      </div>

      {game !== "menu" && (
        <Button variant="outline" onClick={() => setGame("menu")} className="mb-5">← All games</Button>
      )}

      {game === "menu" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((g) => (
            <button key={g.id} onClick={() => setGame(g.id)} className="glass rounded-2xl p-6 text-left hover:scale-[1.02] transition-transform">
              <div className="text-3xl mb-2">{g.emoji}</div>
              <h3 className="font-bold text-lg">{g.name}</h3>
              <p className="text-sm text-muted-foreground">{g.desc}</p>
            </button>
          ))}
        </div>
      )}

      {game === "flappy" && <FlappyBird />}
      {game === "tod" && <TruthOrDare />}
      {game === "ttt" && <TicTacToe />}
      {game === "rps" && <RPS />}
      {game === "guess" && <NumberGuess />}
      {game === "memory" && <Memory />}
    </div>
  );
}

/* ---------- Tic Tac Toe ---------- */
function TicTacToe() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [x, setX] = useState(true);
  const winner = checkWin(board);

  function click(i: number) {
    if (board[i] || winner) return;
    const next = [...board]; next[i] = x ? "X" : "O";
    setBoard(next); setX(!x);
  }
  function reset() { setBoard(Array(9).fill(null)); setX(true); }

  const status = winner ? `${winner} wins! 🎉` : board.every(Boolean) ? "It's a draw" : `Turn: ${x ? "X" : "O"}`;

  return (
    <div className="glass rounded-3xl p-8 max-w-md mx-auto text-center">
      <p className="text-lg font-semibold mb-4">{status}</p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {board.map((c, i) => (
          <button key={i} onClick={() => click(i)} className="aspect-square text-4xl font-bold bg-secondary rounded-xl hover:bg-secondary/70 transition">
            <span className={c === "X" ? "text-primary" : "text-accent"}>{c}</span>
          </button>
        ))}
      </div>
      <Button onClick={reset} variant="outline"><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
    </div>
  );
}
function checkWin(b: (string | null)[]) {
  const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b1,c] of L) if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  return null;
}

/* ---------- RPS ---------- */
function RPS() {
  const [you, setYou] = useState<string | null>(null);
  const [cpu, setCpu] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [score, setScore] = useState(() => Number(localStorage.getItem("rps-score") || 0));
  const OPTS = ["🪨", "📄", "✂️"];

  function play(c: string) {
    const cpuC = OPTS[Math.floor(Math.random() * 3)];
    setYou(c); setCpu(cpuC);
    let r = "Draw";
    if (c !== cpuC) {
      const wins = (c === "🪨" && cpuC === "✂️") || (c === "📄" && cpuC === "🪨") || (c === "✂️" && cpuC === "📄");
      r = wins ? "You win!" : "Computer wins";
      if (wins) { const ns = score + 1; setScore(ns); localStorage.setItem("rps-score", String(ns)); }
    }
    setResult(r);
  }
  return (
    <div className="glass rounded-3xl p-8 max-w-md mx-auto text-center">
      <p className="text-sm text-muted-foreground mb-1"><Trophy className="inline w-4 h-4 mr-1" /> Wins: {score}</p>
      <div className="my-6 flex justify-center gap-8 text-6xl">
        <div><div>{you || "❓"}</div><p className="text-xs mt-2 text-muted-foreground">You</p></div>
        <div><div>{cpu || "❓"}</div><p className="text-xs mt-2 text-muted-foreground">CPU</p></div>
      </div>
      <p className="text-xl font-bold mb-5 h-7">{result}</p>
      <div className="flex justify-center gap-3">
        {OPTS.map((o) => (
          <button key={o} onClick={() => play(o)} className="text-4xl bg-secondary hover:bg-secondary/70 w-16 h-16 rounded-2xl transition">{o}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Number Guess ---------- */
function NumberGuess() {
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState("");
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState("I'm thinking of a number between 1 and 100");
  const [done, setDone] = useState(false);

  function submit() {
    const n = Number(guess); if (!n) return;
    const t = tries + 1; setTries(t);
    if (n === target) { setHint(`🎉 Correct! You got it in ${t} tries.`); setDone(true); }
    else setHint(n < target ? "📈 Try higher" : "📉 Try lower");
    setGuess("");
  }
  function reset() {
    setTarget(Math.floor(Math.random() * 100) + 1); setTries(0); setGuess(""); setHint("New number ready! 1–100"); setDone(false);
  }
  return (
    <div className="glass rounded-3xl p-8 max-w-md mx-auto text-center">
      <p className="text-lg mb-4">{hint}</p>
      <p className="text-sm text-muted-foreground mb-4">Tries: {tries}</p>
      {!done ? (
        <div className="flex gap-2 justify-center">
          <input type="number" value={guess} onChange={(e) => setGuess(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-28 text-center bg-secondary rounded-lg px-3 py-2 text-lg border border-border" />
          <Button onClick={submit} className="bg-hero shadow-glow">Guess</Button>
        </div>
      ) : (
        <Button onClick={reset} variant="outline"><RotateCcw className="w-4 h-4 mr-2" /> Play again</Button>
      )}
    </div>
  );
}

/* ---------- Memory Match ---------- */
function Memory() {
  const EMOJIS = ["🎈", "🎁", "🎲", "🎮", "🚀", "⭐", "🌈", "🍕"];
  const [cards, setCards] = useState<{ e: string; flipped: boolean; matched: boolean }[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  function init() {
    const arr = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5).map(e => ({ e, flipped: false, matched: false }));
    setCards(arr); setPicked([]); setMoves(0);
  }
  useEffect(() => { init(); }, []);

  function flip(i: number) {
    if (cards[i].flipped || cards[i].matched || picked.length === 2) return;
    const next = cards.map((c, j) => j === i ? { ...c, flipped: true } : c);
    setCards(next);
    const p = [...picked, i];
    setPicked(p);
    if (p.length === 2) {
      setMoves(m => m + 1);
      setTimeout(() => {
        setCards(curr => {
          if (curr[p[0]].e === curr[p[1]].e) {
            return curr.map((c, j) => p.includes(j) ? { ...c, matched: true } : c);
          }
          return curr.map((c, j) => p.includes(j) ? { ...c, flipped: false } : c);
        });
        setPicked([]);
      }, 700);
    }
  }
  const won = cards.length > 0 && cards.every(c => c.matched);
  return (
    <div className="glass rounded-3xl p-6 max-w-lg mx-auto text-center">
      <p className="mb-3">Moves: <strong>{moves}</strong> {won && " · 🏆 You won!"}</p>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {cards.map((c, i) => (
          <button key={i} onClick={() => flip(i)}
            className={`aspect-square rounded-xl text-3xl transition ${c.flipped || c.matched ? "bg-hero" : "bg-secondary"}`}>
            {(c.flipped || c.matched) ? c.e : ""}
          </button>
        ))}
      </div>
      <Button onClick={init} variant="outline"><RotateCcw className="w-4 h-4 mr-2" /> New game</Button>
    </div>
  );
}

