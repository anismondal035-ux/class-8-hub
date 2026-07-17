import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Flag } from "lucide-react";

/* Pseudo-3D endless racer. Canvas + perspective segments. Keyboard + touch. */

type CarSkin = { name: string; color: string; accent: string };
const CARS: CarSkin[] = [
  { name: "Violet Bolt", color: "#8b5cf6", accent: "#c4b5fd" },
  { name: "Crimson Ace", color: "#ef4444", accent: "#fecaca" },
  { name: "Cyan Fury", color: "#06b6d4", accent: "#a5f3fc" },
  { name: "Sunset GT", color: "#f59e0b", accent: "#fde68a" },
];
type Track = { name: string; skyTop: string; skyBot: string; grass1: string; grass2: string; road1: string; road2: string; rumble1: string; rumble2: string; laneStripe: string; curveBias: number };
const TRACKS: Track[] = [
  { name: "Midnight City", skyTop: "#1e1b4b", skyBot: "#4c1d95", grass1: "#1a1033", grass2: "#150b28", road1: "#2a2140", road2: "#241a3a", rumble1: "#ffffff", rumble2: "#c026d3", laneStripe: "#e9d5ff", curveBias: 1.0 },
  { name: "Desert Rush", skyTop: "#7c2d12", skyBot: "#fbbf24", grass1: "#78350f", grass2: "#92400e", road1: "#3f3f46", road2: "#27272a", rumble1: "#fef3c7", rumble2: "#dc2626", laneStripe: "#fef9c3", curveBias: 1.5 },
  { name: "Alpine Loop", skyTop: "#0c4a6e", skyBot: "#7dd3fc", grass1: "#065f46", grass2: "#064e3b", road1: "#334155", road2: "#1e293b", rumble1: "#ffffff", rumble2: "#0ea5e9", laneStripe: "#f1f5f9", curveBias: 0.7 },
];

const SEGMENT_LENGTH = 200;
const ROAD_WIDTH = 2000;
const LANES = 3;
const DRAW_DISTANCE = 220;
const LAP_LENGTH = 6000; // segments

export function CarRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [carIdx, setCarIdx] = useState(0);
  const [trackIdx, setTrackIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [lap, setLap] = useState(1);
  const [maxLaps] = useState(3);
  const [lapTime, setLapTime] = useState(0);
  const [bestLap, setBestLap] = useState(() => Number(localStorage.getItem("car-best-lap") || 0));
  const [finished, setFinished] = useState(false);
  const [speedDisp, setSpeedDisp] = useState(0);

  const stateRef = useRef({
    position: 0, speed: 0, playerX: 0,
    keys: { left: false, right: false, gas: false, brake: false },
    lastTs: 0, lapStart: 0, lap: 1, finished: false,
  });

  useEffect(() => {
    const s = stateRef.current;
    const kd = (e: KeyboardEvent) => {
      if (["ArrowLeft","a","A"].includes(e.key)) s.keys.left = true;
      if (["ArrowRight","d","D"].includes(e.key)) s.keys.right = true;
      if (["ArrowUp","w","W"].includes(e.key)) s.keys.gas = true;
      if (["ArrowDown","s","S"," "].includes(e.key)) s.keys.brake = true;
    };
    const ku = (e: KeyboardEvent) => {
      if (["ArrowLeft","a","A"].includes(e.key)) s.keys.left = false;
      if (["ArrowRight","d","D"].includes(e.key)) s.keys.right = false;
      if (["ArrowUp","w","W"].includes(e.key)) s.keys.gas = false;
      if (["ArrowDown","s","S"," "].includes(e.key)) s.keys.brake = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const track = TRACKS[trackIdx];
    const car = CARS[carIdx];
    const s = stateRef.current;
    s.position = 0; s.speed = 0; s.playerX = 0; s.lap = 1; s.finished = false;
    s.lapStart = performance.now();
    setLap(1); setFinished(false); setLapTime(0);

    let raf = 0;
    const maxSpeed = 12000;
    const accel = 6000;
    const decel = 4000;
    const brake = 12000;
    const offRoadDecel = 8000;
    const centrifugal = 0.35;

    // Curve profile for the track
    const curves: number[] = [];
    for (let i = 0; i < LAP_LENGTH; i++) {
      curves.push(Math.sin(i * 0.008) * 3 * track.curveBias + Math.sin(i * 0.0021) * 1.5);
    }

    // Opponent cars
    const opponents = Array.from({ length: 8 }, (_, i) => ({
      z: (i + 1) * (LAP_LENGTH / 10),
      lane: (i % LANES) - 1,
      color: CARS[(i + 1) % CARS.length].color,
      speed: 3000 + Math.random() * 2500,
    }));

    function loop(ts: number) {
      const dt = Math.min(0.05, (ts - (s.lastTs || ts)) / 1000);
      s.lastTs = ts;

      // Input
      const speedRatio = s.speed / maxSpeed;
      if (s.keys.gas) s.speed = Math.min(maxSpeed, s.speed + accel * dt);
      else if (s.keys.brake) s.speed = Math.max(0, s.speed - brake * dt);
      else s.speed = Math.max(0, s.speed - decel * dt);

      const offRoad = Math.abs(s.playerX) > 1;
      if (offRoad) s.speed = Math.max(0, s.speed - offRoadDecel * dt);

      const steerSpeed = 2.5 * dt * (0.4 + speedRatio);
      if (s.keys.left) s.playerX -= steerSpeed;
      if (s.keys.right) s.playerX += steerSpeed;

      const segIdx = Math.floor(s.position / SEGMENT_LENGTH) % LAP_LENGTH;
      const curve = curves[segIdx];
      s.playerX -= curve * speedRatio * centrifugal * dt;
      s.playerX = Math.max(-2.2, Math.min(2.2, s.playerX));

      s.position += s.speed * dt;
      if (s.position >= LAP_LENGTH * SEGMENT_LENGTH) {
        s.position -= LAP_LENGTH * SEGMENT_LENGTH;
        const t = (ts - s.lapStart) / 1000;
        if (bestLap === 0 || t < bestLap) {
          localStorage.setItem("car-best-lap", String(t));
          setBestLap(t);
        }
        s.lap += 1;
        s.lapStart = ts;
        setLap(s.lap);
        if (s.lap > maxLaps) {
          s.finished = true;
          setFinished(true);
          setRunning(false);
          return;
        }
      }
      setLapTime((ts - s.lapStart) / 1000);
      setSpeedDisp(Math.round((s.speed / maxSpeed) * 240));

      // Opponent collision / movement
      for (const o of opponents) {
        o.z += (o.speed - s.speed) * dt * -1;
        if (o.z < s.position - 500) o.z += LAP_LENGTH * SEGMENT_LENGTH;
        if (o.z > s.position + LAP_LENGTH * SEGMENT_LENGTH - 500) o.z -= LAP_LENGTH * SEGMENT_LENGTH;
        const dz = o.z - s.position;
        if (dz > 0 && dz < 400) {
          const oLaneX = o.lane * 0.7;
          if (Math.abs(s.playerX - oLaneX) < 0.5) {
            s.speed = Math.max(0, s.speed * 0.4);
            s.playerX += (s.playerX > oLaneX ? 0.2 : -0.2);
          }
        }
      }

      render(ctx, canvas, track, car, curves, opponents, s);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, carIdx, trackIdx]);

  function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, track: Track, car: CarSkin, curves: number[], opponents: {z:number;lane:number;color:string;speed:number}[], s: typeof stateRef.current) {
    const W = canvas.width, H = canvas.height;
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    skyGrad.addColorStop(0, track.skyTop);
    skyGrad.addColorStop(1, track.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.55);
    // Ground
    ctx.fillStyle = track.grass1;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    // Sun
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.arc(W * 0.7, H * 0.35, 40, 0, Math.PI * 2); ctx.fill();

    const camHeight = 1500;
    const cameraDepth = 1 / Math.tan((100 / 2) * Math.PI / 180);
    const baseSeg = Math.floor(s.position / SEGMENT_LENGTH);
    const percent = (s.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;

    let x = 0, dx = 0;
    let maxY = H;

    const segs: {y:number; w:number; x:number; scale:number; curve:number; idx:number}[] = [];

    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const idx = (baseSeg + n) % LAP_LENGTH;
      const curve = curves[idx];
      const segZ = (baseSeg + n) * SEGMENT_LENGTH - s.position;
      const scale = cameraDepth / (segZ + 1);
      const projX = (W / 2) + scale * (-s.playerX * ROAD_WIDTH / 2 - x) * W / 2;
      const projY = (H / 2) - scale * camHeight * H / 2;
      const projW = scale * ROAD_WIDTH * W / 2;

      segs.push({ y: projY, w: projW, x: projX, scale, curve, idx });

      x += dx;
      dx += curve;
    }

    // Draw from far to near
    for (let n = segs.length - 1; n > 0; n--) {
      const seg = segs[n];
      const segPrev = segs[n - 1];
      if (seg.y >= maxY) continue;
      if (seg.y > H) continue;
      const alt = (seg.idx / 3 | 0) % 2;
      const grass = alt ? track.grass1 : track.grass2;
      const road = alt ? track.road1 : track.road2;
      const rumble = alt ? track.rumble1 : track.rumble2;

      // Grass
      ctx.fillStyle = grass;
      ctx.fillRect(0, seg.y, W, segPrev.y - seg.y + 1);
      // Rumble
      polygon(ctx, segPrev.x - segPrev.w * 1.15, segPrev.y, segPrev.x + segPrev.w * 1.15, segPrev.y,
        seg.x + seg.w * 1.15, seg.y, seg.x - seg.w * 1.15, seg.y, rumble);
      // Road
      polygon(ctx, segPrev.x - segPrev.w, segPrev.y, segPrev.x + segPrev.w, segPrev.y,
        seg.x + seg.w, seg.y, seg.x - seg.w, seg.y, road);
      // Lane stripes
      if (alt) {
        for (let l = 1; l < LANES; l++) {
          const laneX1p = segPrev.x - segPrev.w + (segPrev.w * 2) * (l / LANES);
          const laneX2p = seg.x - seg.w + (seg.w * 2) * (l / LANES);
          polygon(ctx, laneX1p - 3, segPrev.y, laneX1p + 3, segPrev.y,
            laneX2p + 2, seg.y, laneX2p - 2, seg.y, track.laneStripe);
        }
      }
      maxY = seg.y;
    }

    // Opponents
    const sorted = [...opponents].sort((a, b) => (b.z - s.position) - (a.z - s.position));
    for (const o of sorted) {
      const dz = o.z - s.position;
      if (dz < 0 || dz > DRAW_DISTANCE * SEGMENT_LENGTH) continue;
      const nSeg = Math.floor(dz / SEGMENT_LENGTH);
      const seg = segs[nSeg]; if (!seg) continue;
      const carW = seg.w * 0.35;
      const carH = carW * 0.55;
      const cx = seg.x + o.lane * seg.w * 0.55;
      drawCar(ctx, cx, seg.y - carH * 0.5, carW, carH, o.color, "#fff");
    }

    // Player car
    const pw = W * 0.18, ph = pw * 0.55;
    const px = W / 2 - pw / 2 + s.playerX * 30;
    const py = H - ph - 20 + Math.sin(performance.now() / 90) * 2;
    drawCar(ctx, px + pw / 2, py + ph / 2, pw, ph, car.color, car.accent);

    // HUD overlays drawn in DOM
  }

  function drawCar(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string, accent: string) {
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.5, w * 0.55, h * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    // body
    ctx.fillStyle = color;
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 8); ctx.fill();
    // cabin
    ctx.fillStyle = accent;
    roundRect(ctx, cx - w * 0.3, cy - h * 0.4, w * 0.6, h * 0.45, 6); ctx.fill();
    // headlights
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(cx - w * 0.45, cy + h * 0.15, w * 0.15, h * 0.15);
    ctx.fillRect(cx + w * 0.3, cy + h * 0.15, w * 0.15, h * 0.15);
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

  // Touch controls
  const setKey = (k: "left"|"right"|"gas"|"brake", v: boolean) => { stateRef.current.keys[k] = v; };

  return (
    <div className="glass rounded-3xl p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Flag className="w-4 h-4 text-primary" />
          <span className="font-semibold">Lap {Math.min(lap, maxLaps)}/{maxLaps}</span>
          <span className="text-muted-foreground">· {lapTime.toFixed(2)}s</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Speed <strong className="text-foreground">{speedDisp}</strong> km/h</span>
          <span className="text-muted-foreground"><Trophy className="inline w-4 h-4 mr-1 text-primary" />Best: {bestLap ? bestLap.toFixed(2) + "s" : "—"}</span>
        </div>
      </div>

      {!running && (
        <div className="mb-4 grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-1">Car</p>
            <div className="flex gap-2 flex-wrap">
              {CARS.map((c, i) => (
                <button key={c.name} onClick={() => setCarIdx(i)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${i===carIdx ? "bg-hero text-primary-foreground" : "bg-secondary"}`}>
                  <span className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle" style={{background:c.color}} />
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
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${i===trackIdx ? "bg-hero text-primary-foreground" : "bg-secondary"}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden bg-black">
        <canvas ref={canvasRef} width={960} height={540} className="w-full h-auto block" />
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              {finished && <p className="text-2xl font-bold mb-3 text-gradient">🏁 Race complete!</p>}
              <Button size="lg" onClick={() => setRunning(true)} className="bg-hero shadow-glow">
                {finished ? <><RotateCcw className="w-4 h-4 mr-2"/> Race again</> : "Start race"}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">Arrows / WASD · Space = brake</p>
            </div>
          </div>
        )}
      </div>

      {/* Touch controls */}
      {running && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:hidden select-none">
          <TouchBtn label="◀" onDown={() => setKey("left", true)} onUp={() => setKey("left", false)} />
          <TouchBtn label="▶" onDown={() => setKey("right", true)} onUp={() => setKey("right", false)} />
          <TouchBtn label="Brake" onDown={() => setKey("brake", true)} onUp={() => setKey("brake", false)} />
          <TouchBtn label="Gas" onDown={() => setKey("gas", true)} onUp={() => setKey("gas", false)} className="bg-hero text-primary-foreground" />
        </div>
      )}
      {running && (
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => { setRunning(false); setFinished(false); }}>Quit</Button>
        </div>
      )}
    </div>
  );
}

function TouchBtn({ label, onDown, onUp, className = "" }: { label: string; onDown: () => void; onUp: () => void; className?: string }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp(); }}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      className={`py-4 rounded-xl bg-secondary font-bold text-lg active:scale-95 transition ${className}`}
    >
      {label}
    </button>
  );
}
