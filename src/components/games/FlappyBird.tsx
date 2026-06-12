import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Play, RotateCcw } from "lucide-react";

/**
 * Flappy Bird (canvas). Click / tap / space = flap.
 * Score persists in localStorage as "flappy-best".
 */
export function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("flappy-best") || 0));
  const [state, setState] = useState<"idle" | "playing" | "dead">("idle");
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Mutable game state stored in refs to avoid React re-renders on every frame
  const gameRef = useRef({
    birdY: 0, birdV: 0, pipes: [] as { x: number; gapY: number; passed: boolean }[],
    tick: 0, score: 0,
  });

  const W = 360, H = 540;
  const GRAVITY = 0.45, FLAP = -7.2, PIPE_W = 56, GAP = 140, PIPE_SPACING = 200, SPEED = 2.2;
  const BIRD_X = 80, BIRD_R = 14;

  function reset() {
    gameRef.current = { birdY: H / 2, birdV: 0, pipes: [], tick: 0, score: 0 };
    setScore(0);
  }
  function start() {
    reset();
    setState("playing");
  }
  function flap() {
    if (stateRef.current === "idle") { start(); return; }
    if (stateRef.current === "dead") { start(); return; }
    gameRef.current.birdV = FLAP;
  }
  function die() {
    setState("dead");
    setBest(b => {
      const cur = gameRef.current.score;
      if (cur > b) { localStorage.setItem("flappy-best", String(cur)); return cur; }
      return b;
    });
  }

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    function draw() {
      // background gradient
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1a103d");
      g.addColorStop(1, "#3a1f6b");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // moving stars
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      for (let i = 0; i < 30; i++) {
        const x = (i * 41 - (gameRef.current.tick * 0.3) % W + W) % W;
        const y = (i * 73) % H;
        ctx.fillRect(x, y, 2, 2);
      }

      // pipes
      for (const p of gameRef.current.pipes) {
        const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        grad.addColorStop(0, "#a855f7"); grad.addColorStop(1, "#7c3aed");
        ctx.fillStyle = grad;
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - (p.gapY + GAP));
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(p.x, p.gapY - 12, PIPE_W, 12);
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, 12);
      }

      // bird (purple circle with eye)
      ctx.fillStyle = "#f0abfc";
      ctx.beginPath(); ctx.arc(BIRD_X, gameRef.current.birdY, BIRD_R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#1a103d";
      ctx.beginPath(); ctx.arc(BIRD_X + 5, gameRef.current.birdY - 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(BIRD_X + 11, gameRef.current.birdY);
      ctx.lineTo(BIRD_X + 20, gameRef.current.birdY - 3);
      ctx.lineTo(BIRD_X + 20, gameRef.current.birdY + 3);
      ctx.closePath(); ctx.fill();

      // score
      ctx.fillStyle = "white"; ctx.font = "bold 36px system-ui"; ctx.textAlign = "center";
      ctx.fillText(String(gameRef.current.score), W / 2, 60);

      if (stateRef.current === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, H/2 - 50, W, 100);
        ctx.fillStyle = "white"; ctx.font = "bold 20px system-ui";
        ctx.fillText("Tap / Click / Space to Start", W/2, H/2);
        ctx.font = "14px system-ui"; ctx.fillText("Avoid the purple pipes!", W/2, H/2 + 24);
      }
      if (stateRef.current === "dead") {
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, H/2 - 60, W, 120);
        ctx.fillStyle = "white"; ctx.font = "bold 26px system-ui";
        ctx.fillText("Game Over", W/2, H/2 - 10);
        ctx.font = "16px system-ui";
        ctx.fillText(`Score: ${gameRef.current.score}  ·  Best: ${best}`, W/2, H/2 + 18);
        ctx.fillText("Tap to retry", W/2, H/2 + 42);
      }
    }

    function step() {
      if (stateRef.current === "playing") {
        const g = gameRef.current;
        g.tick++;
        g.birdV += GRAVITY;
        g.birdY += g.birdV;

        // spawn pipes
        if (g.tick % Math.floor(PIPE_SPACING / SPEED) === 0) {
          const gapY = 60 + Math.random() * (H - GAP - 120);
          g.pipes.push({ x: W, gapY, passed: false });
        }
        // move & cull pipes
        for (const p of g.pipes) p.x -= SPEED;
        g.pipes = g.pipes.filter(p => p.x + PIPE_W > -10);

        // collisions
        if (g.birdY + BIRD_R >= H || g.birdY - BIRD_R <= 0) die();
        for (const p of g.pipes) {
          if (BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W) {
            if (g.birdY - BIRD_R < p.gapY || g.birdY + BIRD_R > p.gapY + GAP) die();
          }
          if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
            p.passed = true; g.score++; setScore(g.score);
          }
        }
      }
      draw();
      raf = requestAnimationFrame(step);
    }
    reset(); draw();
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [best]);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="glass rounded-3xl p-5 max-w-md mx-auto text-center">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground"><Trophy className="inline w-4 h-4 mr-1 text-primary" /> Best: <b className="text-primary">{best}</b></p>
        <p className="text-sm text-muted-foreground">Score: <b className="text-foreground">{score}</b></p>
      </div>
      <div className="relative inline-block rounded-2xl overflow-hidden shadow-glow">
        <canvas
          ref={canvasRef} width={W} height={H}
          onPointerDown={(e) => { e.preventDefault(); flap(); }}
          className="touch-none cursor-pointer block max-w-full h-auto"
          style={{ width: W, height: H, maxWidth: "100%" }}
        />
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {state === "idle" && <Button onClick={start} className="bg-hero shadow-glow"><Play className="w-4 h-4 mr-1.5" /> Start</Button>}
        {state !== "idle" && <Button onClick={start} variant="outline"><RotateCcw className="w-4 h-4 mr-1.5" /> Restart</Button>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Tap the screen, click, or press Space to flap.</p>
    </div>
  );
}
