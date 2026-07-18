import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Flag, Pause, Play, X } from "lucide-react";

/**
 * Rebuilt arcade racer.
 * - Fixed timestep (60Hz) simulation, decoupled render for smooth motion
 * - Pseudo-3D perspective with stable camera (lerped lateral tracking)
 * - Proper AABB-in-lane collisions, smooth steering, realistic accel/brake curves
 * - Touch + keyboard controls, pause menu, lap timer, speedometer, best lap
 */

type CarSkin = { name: string; color: string; accent: string };
const CARS: CarSkin[] = [
  { name: "Violet Bolt", color: "#8b5cf6", accent: "#ede9fe" },
  { name: "Crimson Ace", color: "#ef4444", accent: "#fee2e2" },
  { name: "Cyan Fury", color: "#06b6d4", accent: "#cffafe" },
  { name: "Sunset GT", color: "#f59e0b", accent: "#fef3c7" },
  { name: "Emerald Z", color: "#10b981", accent: "#d1fae5" },
];

type Track = {
  name: string;
  skyTop: string; skyBot: string;
  grass1: string; grass2: string;
  road1: string; road2: string;
  rumble1: string; rumble2: string;
  laneStripe: string;
  curveBias: number; hillBias: number;
};
const TRACKS: Track[] = [
  { name: "Midnight City", skyTop: "#1e1b4b", skyBot: "#7c3aed", grass1: "#1a1033", grass2: "#150b28", road1: "#3f3f46", road2: "#27272a", rumble1: "#ffffff", rumble2: "#c026d3", laneStripe: "#fef9c3", curveBias: 1.0, hillBias: 0.6 },
  { name: "Desert Rush", skyTop: "#f97316", skyBot: "#fde68a", grass1: "#a16207", grass2: "#854d0e", road1: "#44403c", road2: "#292524", rumble1: "#fef3c7", rumble2: "#dc2626", laneStripe: "#fef9c3", curveBias: 1.4, hillBias: 1.2 },
  { name: "Alpine Loop", skyTop: "#0c4a6e", skyBot: "#7dd3fc", grass1: "#065f46", grass2: "#064e3b", road1: "#334155", road2: "#1e293b", rumble1: "#ffffff", rumble2: "#0ea5e9", laneStripe: "#f1f5f9", curveBias: 0.7, hillBias: 1.5 },
  { name: "Neon Speedway", skyTop: "#020617", skyBot: "#312e81", grass1: "#0f172a", grass2: "#020617", road1: "#1e293b", road2: "#0f172a", rumble1: "#22d3ee", rumble2: "#a855f7", laneStripe: "#fef08a", curveBias: 1.1, hillBias: 0.3 },
];

const SEGMENT_LENGTH = 200;
const ROAD_WIDTH = 2000;
const LANES = 3;
const DRAW_DISTANCE = 240;
const LAP_LENGTH = 5000;
const FIXED_DT = 1 / 60;

export function CarRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [carIdx, setCarIdx] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lap, setLap] = useState(1);
  const maxLaps = 3;
  const [lapTime, setLapTime] = useState(0);
  const [bestLap, setBestLap] = useState(() => Number(localStorage.getItem("car-best-lap-v2") || 0));
  const [finished, setFinished] = useState(false);
  const [speedDisp, setSpeedDisp] = useState(0);
  const [fps, setFps] = useState(60);

  const stateRef = useRef({
    position: 0, speed: 0, playerX: 0, camX: 0,
    keys: { left: false, right: false, gas: false, brake: false },
    steerAxis: 0, // -1..1 from touch
    lapStart: 0, lap: 1, finished: false,
    accTime: 0, lastTs: 0, frameCount: 0, fpsTs: 0,
  });

  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Keyboard
  useEffect(() => {
    const s = stateRef.current;
    const kd = (e: KeyboardEvent) => {
      const k = e.key;
      if (["ArrowLeft","a","A"].includes(k)) s.keys.left = true;
      if (["ArrowRight","d","D"].includes(k)) s.keys.right = true;
      if (["ArrowUp","w","W"].includes(k)) s.keys.gas = true;
      if (["ArrowDown","s","S"," "].includes(k)) s.keys.brake = true;
      if (k === "Escape" || k === "p" || k === "P") setPaused(p => !p);
    };
    const ku = (e: KeyboardEvent) => {
      const k = e.key;
      if (["ArrowLeft","a","A"].includes(k)) s.keys.left = false;
      if (["ArrowRight","d","D"].includes(k)) s.keys.right = false;
      if (["ArrowUp","w","W"].includes(k)) s.keys.gas = false;
      if (["ArrowDown","s","S"," "].includes(k)) s.keys.brake = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  // Responsive canvas sizing (device pixel ratio aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.floor(w * (9 / 16));
      canvas.style.height = h + "px";
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Main loop
  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const track = TRACKS[trackIdx];
    const car = CARS[carIdx];
    const s = stateRef.current;
    s.position = 0; s.speed = 0; s.playerX = 0; s.camX = 0; s.lap = 1; s.finished = false;
    s.lapStart = performance.now(); s.accTime = 0; s.lastTs = 0;
    setLap(1); setFinished(false); setLapTime(0);

    // Physics constants
    const maxSpeed = 300; // "km/h" display
    const accel = 90;
    const decel = 40;
    const brake = 220;
    const offRoadDecel = 180;
    const steerBase = 2.4;

    // Track profile
    const curves = new Float32Array(LAP_LENGTH);
    const hills = new Float32Array(LAP_LENGTH);
    for (let i = 0; i < LAP_LENGTH; i++) {
      curves[i] = (Math.sin(i * 0.006) * 2.2 + Math.sin(i * 0.0018) * 1.1) * track.curveBias;
      hills[i] = (Math.sin(i * 0.004) * 800 + Math.sin(i * 0.0009) * 400) * track.hillBias;
    }

    // Opponents
    const opponents = Array.from({ length: 10 }, (_, i) => ({
      z: (i + 1) * (LAP_LENGTH * SEGMENT_LENGTH / 11),
      lane: ((i % LANES) - 1) * 0.7,
      color: CARS[(i + 2) % CARS.length].color,
      speed: 80 + Math.random() * 60,
    }));

    let raf = 0;

    function step(dt: number) {
      // Input
      const steerInput = (s.keys.left ? -1 : 0) + (s.keys.right ? 1 : 0) + s.steerAxis;
      const clampedSteer = Math.max(-1, Math.min(1, steerInput));

      if (s.keys.gas) s.speed = Math.min(maxSpeed, s.speed + accel * dt);
      else if (s.keys.brake) s.speed = Math.max(0, s.speed - brake * dt);
      else s.speed = Math.max(0, s.speed - decel * dt);

      const offRoad = Math.abs(s.playerX) > 1;
      if (offRoad && s.speed > maxSpeed * 0.4) s.speed = Math.max(maxSpeed * 0.4, s.speed - offRoadDecel * dt);

      const speedRatio = s.speed / maxSpeed;
      const steerAmt = steerBase * dt * (0.35 + speedRatio * 0.9);
      s.playerX += clampedSteer * steerAmt;

      const segIdx = Math.floor(s.position / SEGMENT_LENGTH) % LAP_LENGTH;
      const curve = curves[segIdx];
      s.playerX -= curve * speedRatio * 0.5 * dt;
      s.playerX = Math.max(-2.5, Math.min(2.5, s.playerX));

      // Advance position (convert km/h-ish to sim units)
      s.position += s.speed * 30 * dt;
      if (s.position >= LAP_LENGTH * SEGMENT_LENGTH) {
        s.position -= LAP_LENGTH * SEGMENT_LENGTH;
        const now = performance.now();
        const t = (now - s.lapStart) / 1000;
        if (bestLap === 0 || t < bestLap) {
          localStorage.setItem("car-best-lap-v2", String(t));
          setBestLap(t);
        }
        s.lap += 1;
        s.lapStart = now;
        setLap(s.lap);
        if (s.lap > maxLaps) {
          s.finished = true;
          setFinished(true);
          setRunning(false);
          return;
        }
      }

      // Opponent AI + collision
      for (const o of opponents) {
        o.z += (o.speed - s.speed) * -30 * dt;
        const worldLen = LAP_LENGTH * SEGMENT_LENGTH;
        if (o.z < s.position - worldLen * 0.5) o.z += worldLen;
        if (o.z > s.position + worldLen * 0.5) o.z -= worldLen;
        const dz = o.z - s.position;
        if (dz > 0 && dz < 250) {
          if (Math.abs(s.playerX - o.lane) < 0.45) {
            s.speed = Math.max(0, s.speed * 0.55);
            s.playerX += s.playerX > o.lane ? 0.15 : -0.15;
          }
        }
      }

      // Stable camera: lerp toward player
      s.camX += (s.playerX - s.camX) * Math.min(1, dt * 6);
    }

    function loop(ts: number) {
      if (!s.lastTs) s.lastTs = ts;
      let delta = (ts - s.lastTs) / 1000;
      s.lastTs = ts;
      if (delta > 0.1) delta = 0.1;

      if (!pausedRef.current) {
        s.accTime += delta;
        while (s.accTime >= FIXED_DT) {
          step(FIXED_DT);
          s.accTime -= FIXED_DT;
          if (s.finished) break;
        }
        if (!s.finished) {
          setLapTime((ts - s.lapStart) / 1000);
          setSpeedDisp(Math.round((s.speed / maxSpeed) * 240));
        }
      }

      render(ctx, canvas, track, car, curves, hills, opponents, s);

      // FPS meter
      s.frameCount++;
      if (ts - s.fpsTs > 500) {
        setFps(Math.round(s.frameCount * 1000 / (ts - s.fpsTs)));
        s.frameCount = 0; s.fpsTs = ts;
      }

      if (!s.finished) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, carIdx, trackIdx]);

  function render(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    track: Track,
    car: CarSkin,
    curves: Float32Array,
    hills: Float32Array,
    opponents: { z: number; lane: number; color: string; speed: number }[],
    s: typeof stateRef.current
  ) {
    const W = canvas.width, H = canvas.height;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    skyGrad.addColorStop(0, track.skyTop);
    skyGrad.addColorStop(1, track.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.6);
    ctx.fillStyle = track.grass1;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Sun/moon
    const sunX = W * 0.72;
    const sunY = H * 0.32;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 90);
    sunGrad.addColorStop(0, "rgba(255,255,255,0.85)");
    sunGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - 100, sunY - 100, 200, 200);

    const camDepth = 1 / Math.tan((100 / 2) * Math.PI / 180);
    const camHeight = 1500 + hills[Math.floor(s.position / SEGMENT_LENGTH) % LAP_LENGTH] * 0.3;
    const baseSeg = Math.floor(s.position / SEGMENT_LENGTH);

    let x = 0, dx = 0;
    let maxY = H;
    const segs: { y: number; w: number; x: number; scale: number; idx: number }[] = new Array(DRAW_DISTANCE);

    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const idx = (baseSeg + n) % LAP_LENGTH;
      const curve = curves[idx];
      const segZ = (baseSeg + n) * SEGMENT_LENGTH - s.position;
      const scale = camDepth / (segZ + 1);
      const projX = (W / 2) + scale * (-s.camX * ROAD_WIDTH / 2 - x) * W / 2;
      const worldY = hills[idx];
      const projY = (H / 2) - scale * (camHeight - worldY) * H / 2;
      const projW = scale * ROAD_WIDTH * W / 2;
      segs[n] = { y: projY, w: projW, x: projX, scale, idx };
      x += dx;
      dx += curve;
    }

    // Draw from far to near
    for (let n = DRAW_DISTANCE - 1; n > 0; n--) {
      const seg = segs[n];
      const prev = segs[n - 1];
      if (seg.y >= maxY || seg.y > H) continue;
      const alt = ((seg.idx / 3) | 0) % 2;
      const grass = alt ? track.grass1 : track.grass2;
      const road = alt ? track.road1 : track.road2;
      const rumble = alt ? track.rumble1 : track.rumble2;

      ctx.fillStyle = grass;
      ctx.fillRect(0, seg.y, W, prev.y - seg.y + 1);
      polygon(ctx, prev.x - prev.w * 1.18, prev.y, prev.x + prev.w * 1.18, prev.y,
        seg.x + seg.w * 1.18, seg.y, seg.x - seg.w * 1.18, seg.y, rumble);
      polygon(ctx, prev.x - prev.w, prev.y, prev.x + prev.w, prev.y,
        seg.x + seg.w, seg.y, seg.x - seg.w, seg.y, road);
      if (alt) {
        for (let l = 1; l < LANES; l++) {
          const laneX1p = prev.x - prev.w + (prev.w * 2) * (l / LANES);
          const laneX2p = seg.x - seg.w + (seg.w * 2) * (l / LANES);
          const sw1 = Math.max(1.5, prev.w * 0.008);
          const sw2 = Math.max(1, seg.w * 0.008);
          polygon(ctx, laneX1p - sw1, prev.y, laneX1p + sw1, prev.y,
            laneX2p + sw2, seg.y, laneX2p - sw2, seg.y, track.laneStripe);
        }
      }
      // Fog fade far segments
      if (n > DRAW_DISTANCE * 0.75) {
        const fog = (n - DRAW_DISTANCE * 0.75) / (DRAW_DISTANCE * 0.25);
        ctx.fillStyle = `rgba(0,0,0,${fog * 0.35})`;
        ctx.fillRect(0, seg.y, W, prev.y - seg.y + 1);
      }
      maxY = seg.y;
    }

    // Opponents
    const sorted = [...opponents].sort((a, b) => (b.z - s.position) - (a.z - s.position));
    for (const o of sorted) {
      const dz = o.z - s.position;
      if (dz < 0 || dz > DRAW_DISTANCE * SEGMENT_LENGTH) continue;
      const nSeg = Math.floor(dz / SEGMENT_LENGTH);
      const seg = segs[nSeg];
      if (!seg) continue;
      const carW = seg.w * 0.4;
      const carH = carW * 0.6;
      const cx = seg.x + (o.lane - s.camX) * seg.w * 0.5;
      drawCar(ctx, cx, seg.y - carH * 0.4, carW, carH, o.color, "#f9fafb");
    }

    // Player car
    const pw = W * 0.16, ph = pw * 0.58;
    const bob = Math.sin(performance.now() / 80) * (s.speed / 300) * 2;
    const px = W / 2 - pw / 2 + (s.playerX - s.camX) * 40;
    const py = H - ph - 30 + bob;
    drawCar(ctx, px + pw / 2, py + ph / 2, pw, ph, car.color, car.accent);

    // Speed lines
    if (s.speed > 200) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      const n = 12;
      for (let i = 0; i < n; i++) {
        const yy = (H * 0.65) + Math.random() * H * 0.3;
        const len = (s.speed / 300) * 40 + 10;
        ctx.beginPath();
        ctx.moveTo(Math.random() * W, yy);
        ctx.lineTo(Math.random() * W, yy + len);
        ctx.stroke();
      }
    }
  }

  function drawCar(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string, accent: string) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.55, w * 0.55, h * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    // Body gradient
    const grad = ctx.createLinearGradient(cx, cy - h / 2, cx, cy + h / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, shade(color, -30));
    ctx.fillStyle = grad;
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, Math.max(4, w * 0.08)); ctx.fill();
    // Windshield
    ctx.fillStyle = accent;
    roundRect(ctx, cx - w * 0.3, cy - h * 0.4, w * 0.6, h * 0.42, Math.max(3, w * 0.05)); ctx.fill();
    // Headlights
    ctx.fillStyle = "#fef9c3";
    ctx.fillRect(cx - w * 0.45, cy + h * 0.2, w * 0.14, h * 0.14);
    ctx.fillRect(cx + w * 0.31, cy + h * 0.2, w * 0.14, h * 0.14);
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    roundRect(ctx, cx - w * 0.42, cy - h * 0.42, w * 0.2, h * 0.15, 3); ctx.fill();
  }
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function polygon(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, fill: string) {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
  }
  function shade(hex: string, amt: number) {
    const c = hex.replace("#", "");
    const num = parseInt(c, 16);
    let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  const setKey = useCallback((k: "left" | "right" | "gas" | "brake", v: boolean) => {
    stateRef.current.keys[k] = v;
  }, []);

  return (
    <div className="glass rounded-3xl p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Flag className="w-4 h-4 text-primary" />
          <span className="font-semibold">Lap {Math.min(lap, maxLaps)}/{maxLaps}</span>
          <span className="text-muted-foreground tabular-nums">· {lapTime.toFixed(2)}s</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground tabular-nums">Speed <strong className="text-foreground">{speedDisp}</strong> km/h</span>
          <span className="text-muted-foreground"><Trophy className="inline w-4 h-4 mr-1 text-primary" />Best: {bestLap ? bestLap.toFixed(2) + "s" : "—"}</span>
          {running && <span className="text-xs text-muted-foreground hidden sm:inline">FPS {fps}</span>}
        </div>
      </div>

      {!running && (
        <div className="mb-4 grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-1">Car</p>
            <div className="flex gap-2 flex-wrap">
              {CARS.map((c, i) => (
                <button key={c.name} onClick={() => setCarIdx(i)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${i === carIdx ? "bg-hero text-primary-foreground shadow-glow" : "bg-secondary hover:bg-secondary/80"}`}>
                  <span className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-1">Track</p>
            <div className="flex gap-2 flex-wrap">
              {TRACKS.map((t, i) => (
                <button key={t.name} onClick={() => setTrackIdx(i)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${i === trackIdx ? "bg-hero text-primary-foreground shadow-glow" : "bg-secondary hover:bg-secondary/80"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={wrapRef} className="relative rounded-2xl overflow-hidden bg-black touch-none select-none">
        <canvas ref={canvasRef} className="w-full block" />

        {!running && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center px-4">
              {finished && <p className="text-2xl sm:text-3xl font-bold mb-3 text-gradient">🏁 Race complete!</p>}
              <Button size="lg" onClick={() => { setFinished(false); setRunning(true); setPaused(false); }} className="bg-hero shadow-glow">
                {finished ? <><RotateCcw className="w-4 h-4 mr-2" /> Race again</> : "Start race"}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">Arrows / WASD · Space = brake · P = pause</p>
            </div>
          </div>
        )}

        {running && paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 text-center space-y-3">
              <p className="text-xl font-bold">Paused</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setPaused(false)} className="bg-hero"><Play className="w-4 h-4 mr-1.5" /> Resume</Button>
                <Button variant="outline" onClick={() => { setRunning(false); setPaused(false); setFinished(false); }}><X className="w-4 h-4 mr-1.5" /> Quit</Button>
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

        {/* Speedometer overlay */}
        {running && (
          <div className="absolute bottom-3 left-3 glass rounded-xl px-3 py-2 text-xs font-mono">
            <div className="text-2xl font-bold text-primary tabular-nums leading-none">{speedDisp}</div>
            <div className="text-[10px] uppercase text-muted-foreground">km/h</div>
          </div>
        )}
      </div>

      {/* Touch controls (mobile) */}
      {running && !paused && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden select-none">
          <TouchBtn label="◀" onDown={() => setKey("left", true)} onUp={() => setKey("left", false)} />
          <TouchBtn label="▶" onDown={() => setKey("right", true)} onUp={() => setKey("right", false)} />
          <TouchBtn label="Brake" onDown={() => setKey("brake", true)} onUp={() => setKey("brake", false)} />
          <TouchBtn label="Gas" onDown={() => setKey("gas", true)} onUp={() => setKey("gas", false)} className="bg-hero text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

function TouchBtn({ label, onDown, onUp, className = "" }: { label: string; onDown: () => void; onUp: () => void; className?: string }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); onDown(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp(); }}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      className={`py-5 rounded-xl bg-secondary font-bold text-lg active:scale-95 transition ${className}`}
    >
      {label}
    </button>
  );
}
