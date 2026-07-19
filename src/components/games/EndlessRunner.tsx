import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Trophy, Coins, Shield, Magnet, Zap, X } from "lucide-react";

/**
 * Endless Runner — 3-lane, pseudo-3D canvas game.
 * Controls: ←/→ or A/D to switch lane · ↑/W/Space jump · ↓/S slide · P pause · double-tap ↑ for double-jump
 * Mobile: swipe left/right/up/down, tap = jump.
 */

type Lane = -1 | 0 | 1;
type Obstacle = { z: number; lane: Lane; kind: "block" | "duck" | "wall" };
type Pickup = { z: number; lane: Lane; kind: "coin" | "magnet" | "shield" | "boost"; taken?: boolean };

const LANE_X = [-1.1, 0, 1.1];
const WORLD_LEN = 400;
const CAM_HEIGHT = 1.6;
const CAM_DEPTH = 1 / Math.tan((100 / 2) * Math.PI / 180);

export function EndlessRunner() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("runner-best") || 0));
  const [totalCoins, setTotalCoins] = useState(() => Number(localStorage.getItem("runner-coins-total") || 0));
  const [powerText, setPowerText] = useState<string>("");

  const stateRef = useRef({
    lane: 0 as Lane,
    laneAnim: 0,
    y: 0, vy: 0,
    jumps: 0,
    sliding: 0,
    z: 0,
    speed: 18,
    obstacles: [] as Obstacle[],
    pickups: [] as Pickup[],
    score: 0,
    coins: 0,
    magnetTime: 0,
    shieldTime: 0,
    boostTime: 0,
    keys: { left: false, right: false, jump: false, slide: false },
    lastTs: 0, acc: 0, over: false,
    envSeed: Math.random() * 1000,
    envTint: 0,
  });

  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Responsive canvas
  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(320, Math.floor(r.width));
      const h = Math.floor(w * (9 / 16));
      canvas.style.height = h + "px";
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Keyboard
  useEffect(() => {
    const s = stateRef.current;
    const doJump = () => {
      if (s.jumps < 2 && s.y >= 0) {
        s.vy = s.jumps === 0 ? 9 : 7.5;
        s.jumps++;
        s.sliding = 0;
      }
    };
    const doSlide = () => { if (s.y < 0.1) s.sliding = 0.6; };
    const kd = (e: KeyboardEvent) => {
      const k = e.key;
      if (["ArrowLeft","a","A"].includes(k)) { if (!s.keys.left) { s.lane = Math.max(-1, s.lane - 1) as Lane; } s.keys.left = true; }
      if (["ArrowRight","d","D"].includes(k)) { if (!s.keys.right) { s.lane = Math.min(1, s.lane + 1) as Lane; } s.keys.right = true; }
      if (["ArrowUp","w","W"," "].includes(k)) { if (!s.keys.jump) doJump(); s.keys.jump = true; }
      if (["ArrowDown","s","S"].includes(k)) { if (!s.keys.slide) doSlide(); s.keys.slide = true; }
      if (k === "p" || k === "P" || k === "Escape") setPaused(p => !p);
    };
    const ku = (e: KeyboardEvent) => {
      const k = e.key;
      if (["ArrowLeft","a","A"].includes(k)) s.keys.left = false;
      if (["ArrowRight","d","D"].includes(k)) s.keys.right = false;
      if (["ArrowUp","w","W"," "].includes(k)) s.keys.jump = false;
      if (["ArrowDown","s","S"].includes(k)) s.keys.slide = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  // Touch / swipe
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    let sx = 0, sy = 0, st = 0;
    const s = stateRef.current;
    const onDown = (e: PointerEvent) => { sx = e.clientX; sy = e.clientY; st = performance.now(); };
    const onUp = (e: PointerEvent) => {
      const dx = e.clientX - sx, dy = e.clientY - sy, dt = performance.now() - st;
      if (dt > 500) return;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax < 25 && ay < 25) {
        // tap = jump
        if (s.jumps < 2 && s.y >= 0) { s.vy = s.jumps === 0 ? 9 : 7.5; s.jumps++; s.sliding = 0; }
        return;
      }
      if (ax > ay) {
        if (dx > 0) s.lane = Math.min(1, s.lane + 1) as Lane;
        else s.lane = Math.max(-1, s.lane - 1) as Lane;
      } else {
        if (dy < 0) { if (s.jumps < 2 && s.y >= 0) { s.vy = s.jumps === 0 ? 9 : 7.5; s.jumps++; s.sliding = 0; } }
        else { if (s.y < 0.1) s.sliding = 0.6; }
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => { el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointerup", onUp); };
  }, []);

  // Reset & main loop
  useEffect(() => {
    if (!running) return;
    const s = stateRef.current;
    Object.assign(s, {
      lane: 0, laneAnim: 0, y: 0, vy: 0, jumps: 0, sliding: 0, z: 0, speed: 18,
      obstacles: [], pickups: [], score: 0, coins: 0,
      magnetTime: 0, shieldTime: 0, boostTime: 0,
      lastTs: 0, acc: 0, over: false, envSeed: Math.random() * 1000, envTint: 0,
    });
    setScore(0); setCoins(0); setGameOver(false); setPowerText("");

    // Seed initial spawns
    for (let z = 30; z < 300; z += 12 + Math.random() * 20) spawn(z, s);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    let raf = 0;

    const FIXED = 1 / 60;
    function step(dt: number) {
      // Difficulty ramps
      s.speed = Math.min(42, 18 + s.score / 600) + (s.boostTime > 0 ? 12 : 0);
      s.z += s.speed * dt;
      s.score += s.speed * dt * 4;

      // Lane lerp
      const targetX = LANE_X[s.lane + 1];
      s.laneAnim += (targetX - s.laneAnim) * Math.min(1, dt * 12);

      // Jump / gravity
      s.vy -= 22 * dt;
      s.y += s.vy * dt;
      if (s.y < 0) { s.y = 0; s.vy = 0; s.jumps = 0; }

      // Slide timer
      if (s.sliding > 0) s.sliding = Math.max(0, s.sliding - dt);

      // Timers
      if (s.magnetTime > 0) s.magnetTime -= dt;
      if (s.shieldTime > 0) s.shieldTime -= dt;
      if (s.boostTime > 0) s.boostTime -= dt;

      // Spawn ahead
      const farthest = Math.max(s.z + 50, ...s.obstacles.map(o => o.z), ...s.pickups.map(p => p.z));
      if (farthest < s.z + 300) {
        spawn(farthest + 10 + Math.random() * 14, s);
      }

      // Cull
      s.obstacles = s.obstacles.filter(o => o.z > s.z - 5);
      s.pickups = s.pickups.filter(p => p.z > s.z - 5 && !p.taken);

      // Magnet pull
      if (s.magnetTime > 0) {
        for (const p of s.pickups) {
          if (p.kind !== "coin" || p.taken) continue;
          const dz = p.z - s.z;
          if (dz > 0 && dz < 18) p.lane = s.lane;
        }
      }

      // Collisions
      const px = s.laneAnim;
      const py = s.y;
      for (const p of s.pickups) {
        if (p.taken) continue;
        const dz = p.z - s.z;
        if (dz > -1 && dz < 2 && Math.abs(LANE_X[p.lane + 1] - px) < 0.6 && py < 1.5) {
          p.taken = true;
          if (p.kind === "coin") { s.coins += 1; s.score += 25; setCoins(s.coins); }
          else if (p.kind === "magnet") { s.magnetTime = 7; flash("🧲 Magnet"); }
          else if (p.kind === "shield") { s.shieldTime = 6; flash("🛡 Shield"); }
          else if (p.kind === "boost") { s.boostTime = 4; flash("⚡ Speed boost"); }
        }
      }
      for (const o of s.obstacles) {
        const dz = o.z - s.z;
        if (dz > -1 && dz < 1.5 && o.lane === s.lane) {
          const hitDuck = o.kind === "duck" && s.sliding <= 0 && py < 0.6;
          const hitJumpable = o.kind === "block" && py < 0.9;
          const hitWall = o.kind === "wall" && py < 1.8;
          if (hitDuck || hitJumpable || hitWall) {
            if (s.shieldTime > 0) {
              s.shieldTime = 0;
              o.lane = 99 as Lane; // consume
              flash("🛡 Absorbed");
            } else {
              s.over = true;
              return;
            }
          }
        }
      }

      setScore(Math.floor(s.score));
    }

    function loop(ts: number) {
      if (!s.lastTs) s.lastTs = ts;
      let d = (ts - s.lastTs) / 1000; s.lastTs = ts;
      if (d > 0.1) d = 0.1;

      if (!pausedRef.current) {
        s.acc += d;
        while (s.acc >= FIXED) { step(FIXED); s.acc -= FIXED; if (s.over) break; }
      }
      render(ctx, canvas, s);

      if (s.over) {
        const b = Math.max(best, Math.floor(s.score));
        localStorage.setItem("runner-best", String(b));
        setBest(b);
        const tc = totalCoins + s.coins;
        localStorage.setItem("runner-coins-total", String(tc));
        setTotalCoins(tc);
        setGameOver(true);
        setRunning(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const flashRef = useRef<number | null>(null);
  function flash(t: string) {
    setPowerText(t);
    if (flashRef.current) window.clearTimeout(flashRef.current);
    flashRef.current = window.setTimeout(() => setPowerText(""), 1200);
  }

  function spawn(z: number, s: typeof stateRef.current) {
    // Ensure at least one lane is clear
    const usedLanes = new Set<number>();
    const roll = Math.random();
    const lanesToUse = roll < 0.55 ? 1 : roll < 0.85 ? 2 : 0; // sometimes just pickups
    for (let i = 0; i < lanesToUse; i++) {
      let ln: Lane;
      do { ln = (Math.floor(Math.random() * 3) - 1) as Lane; } while (usedLanes.has(ln));
      usedLanes.add(ln);
      const k = Math.random();
      const kind: Obstacle["kind"] = k < 0.4 ? "block" : k < 0.75 ? "duck" : "wall";
      s.obstacles.push({ z, lane: ln, kind });
    }
    // pickups on remaining lanes
    for (let ln = -1 as Lane; ln <= 1; ln = (ln + 1) as Lane) {
      if (usedLanes.has(ln)) continue;
      const r = Math.random();
      if (r < 0.55) {
        // coin trail
        for (let i = 0; i < 4; i++) s.pickups.push({ z: z + i * 3, lane: ln, kind: "coin" });
      } else if (r < 0.62) s.pickups.push({ z, lane: ln, kind: "magnet" });
      else if (r < 0.69) s.pickups.push({ z, lane: ln, kind: "shield" });
      else if (r < 0.74) s.pickups.push({ z, lane: ln, kind: "boost" });
    }
  }

  function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, s: typeof stateRef.current) {
    const W = canvas.width, H = canvas.height;

    // Sky (shifting hue with envSeed + z)
    const env = ((s.z / 400) + s.envSeed) % 4;
    const palettes = [
      ["#1e1b4b", "#7c3aed", "#0f172a", "#4c1d95"], // twilight
      ["#082f49", "#0284c7", "#0c4a6e", "#075985"], // ocean
      ["#134e4a", "#059669", "#022c22", "#065f46"], // forest
      ["#7c2d12", "#f59e0b", "#431407", "#b45309"], // desert dusk
    ];
    const pIdx = Math.floor(env);
    const [skyTop, skyBot, groundTop, groundBot] = palettes[pIdx];

    const g1 = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    g1.addColorStop(0, skyTop); g1.addColorStop(1, skyBot);
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H * 0.6);

    const g2 = ctx.createLinearGradient(0, H * 0.6, 0, H);
    g2.addColorStop(0, groundTop); g2.addColorStop(1, groundBot);
    ctx.fillStyle = g2; ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Sun
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(W * 0.7, H * 0.28, W * 0.04, 0, Math.PI * 2); ctx.fill();

    // Distant mountains parallax
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    const mOffset = (s.z * 4) % W;
    for (let i = -1; i < 6; i++) {
      const x = i * (W / 4) - mOffset % (W / 4);
      ctx.beginPath();
      ctx.moveTo(x, H * 0.6);
      ctx.lineTo(x + W / 8, H * 0.4);
      ctx.lineTo(x + W / 4, H * 0.6);
      ctx.closePath(); ctx.fill();
    }

    // Road: perspective strips
    const horizonY = H * 0.55;
    const roadNearW = W * 0.75;
    const roadFarW = W * 0.08;

    // Ground
    ctx.beginPath();
    ctx.moveTo(W / 2 - roadFarW / 2, horizonY);
    ctx.lineTo(W / 2 + roadFarW / 2, horizonY);
    ctx.lineTo(W / 2 + roadNearW / 2, H);
    ctx.lineTo(W / 2 - roadNearW / 2, H);
    ctx.closePath();
    ctx.fillStyle = "#1f1a2e"; ctx.fill();

    // Road stripes (animate with z)
    const stripes = 30;
    for (let i = 0; i < stripes; i++) {
      const t1 = i / stripes;
      const t2 = (i + 0.5) / stripes;
      const zoff = (s.z * 2 % 1);
      const t1a = ((t1 + zoff) % 1);
      const t2a = ((t2 + zoff) % 1);
      const y1 = horizonY + (H - horizonY) * t1a;
      const y2 = horizonY + (H - horizonY) * t2a;
      const w1 = roadFarW + (roadNearW - roadFarW) * t1a;
      const w2 = roadFarW + (roadNearW - roadFarW) * t2a;
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(W / 2 - w1 / 2, y1);
        ctx.lineTo(W / 2 + w1 / 2, y1);
        ctx.lineTo(W / 2 + w2 / 2, y2);
        ctx.lineTo(W / 2 - w2 / 2, y2);
        ctx.closePath(); ctx.fill();
      }
    }

    // Lane divider dashes
    for (let l = -1; l <= 1; l += 2) {
      for (let i = 0; i < 20; i++) {
        const t = ((i / 20) + (s.z * 2 % 1)) % 1;
        if (Math.floor((i + s.z * 2) % 2) !== 0) continue;
        const y = horizonY + (H - horizonY) * t;
        const w = roadFarW + (roadNearW - roadFarW) * t;
        const laneX = W / 2 + (l * 0.33) * w;
        ctx.fillStyle = "rgba(250,204,21,0.55)";
        ctx.fillRect(laneX - w * 0.008, y, w * 0.016, 4 + t * 8);
      }
    }

    // Project world points
    function project(worldX: number, worldY: number, worldZ: number) {
      const dz = worldZ - s.z + 0.5;
      if (dz <= 0.05) return null;
      const scale = CAM_DEPTH / dz;
      const sx = W / 2 + scale * worldX * (W / 2);
      const sy = horizonY + (H - horizonY) - scale * (worldY - CAM_HEIGHT) * (H - horizonY);
      const sz = scale;
      return { x: sx, y: sy, s: sz };
    }

    // Draw obstacles + pickups sorted far→near
    const drawList: { z: number; fn: () => void }[] = [];

    for (const o of s.obstacles) {
      if (o.lane === (99 as Lane)) continue;
      drawList.push({ z: o.z, fn: () => {
        const wx = LANE_X[o.lane + 1];
        if (o.kind === "block") {
          const p = project(wx - 0.35, 0, o.z);
          const p2 = project(wx + 0.35, 0.7, o.z);
          if (!p || !p2) return;
          const grad = ctx.createLinearGradient(p.x, p2.y, p.x, p.y);
          grad.addColorStop(0, "#f472b6"); grad.addColorStop(1, "#be185d");
          ctx.fillStyle = grad; ctx.fillRect(p.x, p2.y, p2.x - p.x, p.y - p2.y);
          ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.strokeRect(p.x, p2.y, p2.x - p.x, p.y - p2.y);
        } else if (o.kind === "duck") {
          // low bar to slide under
          const p = project(wx - 0.5, 1.4, o.z);
          const p2 = project(wx + 0.5, 1.9, o.z);
          if (!p || !p2) return;
          ctx.fillStyle = "#fbbf24"; ctx.fillRect(p.x, p2.y, p2.x - p.x, p.y - p2.y);
          // posts
          const pl = project(wx - 0.5, 0, o.z), pr = project(wx + 0.5, 0, o.z);
          if (pl && pr) {
            ctx.fillStyle = "#78350f";
            ctx.fillRect(pl.x - 3, p.y, 6, pl.y - p.y);
            ctx.fillRect(pr.x - 3, p.y, 6, pr.y - p.y);
          }
        } else {
          // wall — full lane block
          const p = project(wx - 0.5, 0, o.z);
          const p2 = project(wx + 0.5, 2.2, o.z);
          if (!p || !p2) return;
          const grad = ctx.createLinearGradient(0, p2.y, 0, p.y);
          grad.addColorStop(0, "#f87171"); grad.addColorStop(1, "#7f1d1d");
          ctx.fillStyle = grad; ctx.fillRect(p.x, p2.y, p2.x - p.x, p.y - p2.y);
        }
      }});
    }
    for (const p of s.pickups) {
      if (p.taken) continue;
      drawList.push({ z: p.z, fn: () => {
        const wx = LANE_X[p.lane + 1];
        const bob = Math.sin(performance.now() / 200 + p.z) * 0.15;
        const pr = project(wx, 1 + bob, p.z);
        if (!pr) return;
        const r = Math.max(2, pr.s * 25);
        if (p.kind === "coin") {
          ctx.fillStyle = "#fde047";
          ctx.beginPath(); ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#a16207"; ctx.beginPath(); ctx.arc(pr.x, pr.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
        } else if (p.kind === "magnet") {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(pr.x - r, pr.y - r, r * 0.7, r * 2);
          ctx.fillRect(pr.x + r * 0.3, pr.y - r, r * 0.7, r * 2);
          ctx.fillStyle = "#f3f4f6";
          ctx.fillRect(pr.x - r, pr.y - r, r * 0.7, r * 0.5);
          ctx.fillRect(pr.x + r * 0.3, pr.y - r, r * 0.7, r * 0.5);
        } else if (p.kind === "shield") {
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.moveTo(pr.x, pr.y - r);
          ctx.lineTo(pr.x + r, pr.y);
          ctx.lineTo(pr.x, pr.y + r);
          ctx.lineTo(pr.x - r, pr.y);
          ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.moveTo(pr.x - r * 0.6, pr.y - r);
          ctx.lineTo(pr.x + r * 0.4, pr.y - r * 0.2);
          ctx.lineTo(pr.x, pr.y);
          ctx.lineTo(pr.x + r * 0.6, pr.y + r);
          ctx.lineTo(pr.x - r * 0.4, pr.y + r * 0.2);
          ctx.lineTo(pr.x, pr.y);
          ctx.closePath(); ctx.fill();
        }
      }});
    }
    drawList.sort((a, b) => b.z - a.z);
    for (const d of drawList) d.fn();

    // Player (front, always in same screen zone)
    const px = W / 2 + s.laneAnim * (roadNearW * 0.33);
    const baseY = H - H * 0.18;
    const jumpOff = s.y * 40;
    const isSlide = s.sliding > 0;
    const pw = W * 0.09, ph = isSlide ? pw * 0.7 : pw * 1.35;
    const py = baseY - ph - jumpOff;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath(); ctx.ellipse(px, baseY - 4, pw * 0.55, pw * 0.15, 0, 0, Math.PI * 2); ctx.fill();

    // Body
    const bodyGrad = ctx.createLinearGradient(px, py, px, py + ph);
    bodyGrad.addColorStop(0, "#c4b5fd"); bodyGrad.addColorStop(1, "#7c3aed");
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, px - pw / 2, py, pw, ph, pw * 0.25); ctx.fill();
    // Face
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath(); ctx.arc(px, py + pw * 0.4, pw * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(px - pw * 0.15, py + pw * 0.35, pw * 0.08, pw * 0.08);
    ctx.fillRect(px + pw * 0.07, py + pw * 0.35, pw * 0.08, pw * 0.08);

    // Shield aura
    if (s.shieldTime > 0) {
      ctx.strokeStyle = `rgba(56,189,248,${0.5 + Math.sin(performance.now() / 100) * 0.3})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(px, py + ph / 2, pw * 0.9, 0, Math.PI * 2); ctx.stroke();
    }
    // Boost trails
    if (s.boostTime > 0) {
      ctx.fillStyle = "rgba(168,85,247,0.5)";
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(px - pw * 0.4 + Math.random() * pw * 0.8, py + ph + i * 6, 3, 8);
      }
    }
  }

  const nudgeLane = useCallback((dir: -1 | 1) => {
    const s = stateRef.current;
    s.lane = Math.max(-1, Math.min(1, s.lane + dir)) as Lane;
  }, []);
  const doJump = useCallback(() => {
    const s = stateRef.current;
    if (s.jumps < 2 && s.y >= 0) { s.vy = s.jumps === 0 ? 9 : 7.5; s.jumps++; s.sliding = 0; }
  }, []);
  const doSlide = useCallback(() => {
    const s = stateRef.current;
    if (s.y < 0.1) s.sliding = 0.6;
  }, []);

  return (
    <div className="glass rounded-3xl p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tabular-nums">{score.toLocaleString()}</span>
          <span className="text-muted-foreground"><Coins className="inline w-4 h-4 mr-1 text-yellow-400" />{coins}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span><Trophy className="inline w-4 h-4 mr-1 text-primary" />Best: {best.toLocaleString()}</span>
          <span className="hidden sm:inline">Total coins: {totalCoins}</span>
        </div>
      </div>

      <div ref={wrapRef} className="relative rounded-2xl overflow-hidden bg-black touch-none select-none">
        <canvas ref={canvasRef} className="w-full block" />

        {powerText && running && !paused && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 glass px-4 py-1.5 rounded-full text-sm font-bold animate-in fade-in">
            {powerText}
          </div>
        )}

        {/* Active buffs */}
        {running && !paused && (
          <div className="absolute top-3 left-3 flex flex-col gap-1 text-xs">
            {stateRef.current.magnetTime > 0 && <Buff icon={<Magnet className="w-3 h-3" />} label={`${stateRef.current.magnetTime.toFixed(1)}s`} />}
            {stateRef.current.shieldTime > 0 && <Buff icon={<Shield className="w-3 h-3" />} label={`${stateRef.current.shieldTime.toFixed(1)}s`} />}
            {stateRef.current.boostTime > 0 && <Buff icon={<Zap className="w-3 h-3" />} label={`${stateRef.current.boostTime.toFixed(1)}s`} />}
          </div>
        )}

        {!running && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center px-4">
              {gameOver ? (
                <>
                  <p className="text-3xl font-bold mb-2 text-gradient">Run over</p>
                  <p className="text-muted-foreground mb-4">Score {score.toLocaleString()} · {coins} coins</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold mb-2 text-gradient">Endless Runner</p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Dodge obstacles · collect coins · grab power-ups. Runs get harder as you go.</p>
                </>
              )}
              <Button size="lg" onClick={() => { setGameOver(false); setRunning(true); setPaused(false); }} className="bg-hero shadow-glow">
                {gameOver ? <><RotateCcw className="w-4 h-4 mr-2" /> Run again</> : <><Play className="w-4 h-4 mr-2" /> Start run</>}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">← → lane · ↑ jump (×2) · ↓ slide · P pause · swipe on mobile</p>
            </div>
          </div>
        )}

        {running && paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 text-center space-y-3">
              <p className="text-xl font-bold">Paused</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setPaused(false)} className="bg-hero"><Play className="w-4 h-4 mr-1.5" /> Resume</Button>
                <Button variant="outline" onClick={() => { setRunning(false); setPaused(false); }}><X className="w-4 h-4 mr-1.5" /> Quit</Button>
              </div>
            </div>
          </div>
        )}

        {running && !paused && (
          <button
            onClick={() => setPaused(true)}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white"
            aria-label="Pause"
          >
            <Pause className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Touch controls for mobile */}
      {running && !paused && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden select-none">
          <TouchBtn label="◀" onTap={() => nudgeLane(-1)} />
          <TouchBtn label="Jump" onTap={doJump} className="bg-hero text-primary-foreground" />
          <TouchBtn label="Slide" onTap={doSlide} />
          <TouchBtn label="▶" onTap={() => nudgeLane(1)} />
        </div>
      )}
    </div>
  );
}

function Buff({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white">
      {icon}{label}
    </span>
  );
}
function TouchBtn({ label, onTap, className = "" }: { label: string; onTap: () => void; className?: string }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onTap(); }}
      className={`py-5 rounded-xl bg-secondary font-bold text-lg active:scale-95 transition ${className}`}
    >
      {label}
    </button>
  );
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
