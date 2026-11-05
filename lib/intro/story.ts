// LIMITLINE opening film (founder, Nov 5): "the evolution of greatness", six chapters you scroll
// through: I Fire, II Rise, III Endurance, IV Stillness, V The line, VI You. The scene is scrubbed
// by scroll with a little inertia, so it plays forward and backward under your finger.
// Browser-only canvas; components/landing-film.tsx mounts it. The mini app demo
// (docs/demo/limitline-mini.html) runs the same scene.

type Pt = { x: number; y: number };
type StageKey = "lean" | "headK" | "torso" | "arm" | "leg" | "tAmp" | "kBase" | "kAmp" | "aBase" | "aAmp" | "aSplit" | "eBase" | "eAmp" | "bob";
type Stage = Record<StageKey, number>;
type Pose = { hip: Pt; neck: Pt; head: Pt; shoulder: Pt; legs: { k: Pt; f: Pt }[]; arms: { e: Pt; h: Pt }[] };
export interface StoryOptions {
  chapters?: number;
  reducedMotion?: boolean;
  font?: string;
  onProgress?: (chapter: number) => void;
}
export interface StoryHandle {
  destroy(): void;
  progress(): number;
}

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bell = (x: number, c: number, w: number) => Math.max(0, 1 - Math.abs(x - c) / w);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- Figures (same articulated pictogram as the evolution graphic) ----------
const STAGES: Stage[] = [
  { lean: 1.02, headK: 0.62, torso: 0.3, arm: 0.46, leg: 0.36, tAmp: 0.3, kBase: 0.62, kAmp: 0.3, aBase: 0.32, aAmp: 0.3, aSplit: 0, eBase: 0.05, eAmp: 0.08, bob: 0.006 },
  { lean: 0.62, headK: 0.6, torso: 0.3, arm: 0.36, leg: 0.42, tAmp: 0.36, kBase: 0.42, kAmp: 0.42, aBase: 0.18, aAmp: 0.3, aSplit: 0, eBase: 0.25, eAmp: 0.1, bob: 0.008 },
  { lean: 0.1, headK: 0.5, torso: 0.31, arm: 0.33, leg: 0.47, tAmp: 0.42, kBase: 0.1, kAmp: 0.6, aBase: 0.02, aAmp: 0.36, aSplit: 0, eBase: 0.3, eAmp: 0.15, bob: 0.01 },
  { lean: 0.24, headK: 0.35, torso: 0.31, arm: 0.32, leg: 0.48, tAmp: 0.82, kBase: 0.5, kAmp: 1.25, aBase: 0.05, aAmp: 0.95, aSplit: 0, eBase: 1.5, eAmp: 0.15, bob: 0.028 },
  { lean: -0.06, headK: 2, torso: 0.31, arm: 0.32, leg: 0.48, tAmp: 0.18, kBase: 0.05, kAmp: 0.1, aBase: Math.PI - 0.12, aAmp: 0, aSplit: 0.36, eBase: -0.04, eAmp: 0, bob: 0 },
];
const STILL: Stage = { ...STAGES[2], tAmp: 0.05, kBase: 0.04, kAmp: 0, aAmp: 0.02, aBase: 0.04, eBase: 0.12, eAmp: 0, lean: 0.02, headK: 0 };
const KEYS = Object.keys(STAGES[0]) as (keyof Stage)[];
function stageAt(s: number): Stage {
  const i = clamp(Math.floor(s), 0, STAGES.length - 2), t = ease(clamp(s - i, 0, 1)), out = { ...STAGES[i] };
  for (const k of KEYS) out[k] = lerp(STAGES[i][k], STAGES[i + 1][k], t);
  return out;
}
function pose(p: Stage, x: number, ph: number, S: number, G: number): Pose {
  const up = (a: number, l: number, f: Pt): Pt => ({ x: f.x + Math.sin(a) * l * S, y: f.y - Math.cos(a) * l * S });
  const down = (a: number, l: number, f: Pt): Pt => ({ x: f.x + Math.sin(a) * l * S, y: f.y + Math.cos(a) * l * S });
  const hip = { x: 0, y: 0 }, neck = up(p.lean, p.torso, hip), head = up(p.lean * p.headK, 0.11, neck);
  const shoulder = { x: neck.x * 0.94, y: neck.y * 0.94 };
  const legs = [0, Math.PI].map((o) => { const f = ph + o, th = p.tAmp * Math.sin(f), kn = p.kBase + p.kAmp * Math.max(0, Math.cos(f)) * (p.kAmp > 0.9 ? 1 : 0.9), k = down(th, p.leg * 0.5, hip); return { k, f: down(th - kn, p.leg * 0.5, k) }; });
  const arms = [0, Math.PI].map((o, i) => { const f = ph + o + Math.PI, u = p.aBase + p.aAmp * Math.sin(f) + (i === 0 ? -p.aSplit : p.aSplit), e = down(u, p.arm * 0.5, shoulder); return { e, h: down(u + p.eBase + p.eAmp * Math.cos(f), p.arm * 0.5, e) }; });
  let low = Math.max(legs[0].f.y, legs[1].f.y);
  const hw = clamp((p.lean - 0.75) / 0.25, 0, 1);
  if (hw > 0) low = Math.max(low, lerp(low, Math.max(arms[0].h.y, arms[1].h.y), hw));
  const dy = G - low - p.bob * S * Math.abs(Math.sin(ph));
  const mv = (q: Pt): Pt => ({ x: q.x + x, y: Math.min(q.y + dy, G) });
  return { hip: mv(hip), neck: mv(neck), head: mv(head), shoulder: mv(shoulder), legs: legs.map((l) => ({ k: mv(l.k), f: mv(l.f) })), arms: arms.map((a) => ({ e: mv(a.e), h: mv(a.h) })) };
}
function figure(ctx: CanvasRenderingContext2D, P: Pose, S: number, near: string, far: string, alpha: number) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const limb = (a: Pt, b: Pt, c: Pt, w: number, col: string) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.stroke(); };
  const w = S * 0.075;
  limb(P.hip, P.legs[1].k, P.legs[1].f, w, far);
  limb(P.shoulder, P.arms[1].e, P.arms[1].h, w * 0.9, far);
  ctx.strokeStyle = near; ctx.lineWidth = S * 0.12; ctx.beginPath(); ctx.moveTo(P.hip.x, P.hip.y); ctx.lineTo(P.neck.x, P.neck.y); ctx.stroke();
  limb(P.hip, P.legs[0].k, P.legs[0].f, w, near);
  ctx.fillStyle = near; ctx.beginPath(); ctx.arc(P.head.x, P.head.y, S * 0.068, 0, TAU); ctx.fill();
  limb(P.shoulder, P.arms[0].e, P.arms[0].h, w * 0.9, near);
  ctx.restore();
}

// ---------- Deterministic randomness and terrain ----------
function rng(seed: number): () => number { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function ridge(rand: () => number, n: number, rough: number, peakAt?: number): number[] {
  const h = new Array(n + 1).fill(0);
  h[0] = rand() * 0.4; h[n] = rand() * 0.4;
  const step = (a: number, b: number, r: number): void => { if (b - a < 2) return; const m = (a + b) >> 1; h[m] = (h[a] + h[b]) / 2 + (rand() - 0.5) * r; step(a, m, r * rough); step(m, b, r * rough); };
  step(0, n, 1);
  if (peakAt != null) { const p = Math.round(peakAt * n); for (let i = 0; i <= n; i++) h[i] += Math.max(0, 1 - Math.abs(i - p) / (n * 0.22)) * 0.55; }
  // soften: two passes of a small moving average, so ridges read as mountains, not noise
  let out = h;
  for (let pass = 0; pass < 2; pass++) out = out.map((v, i) => (out[Math.max(0, i - 1)] + v * 2 + out[Math.min(n, i + 1)]) / 4);
  const lo = Math.min(...out), hi = Math.max(...out);
  return out.map((v) => (v - lo) / (hi - lo || 1));
}

export function mountStory(scroller: HTMLElement, canvas: HTMLCanvasElement, opts: StoryOptions = {}): StoryHandle {
  const ctx = canvas.getContext("2d")!;
  const reduced = opts.reducedMotion ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const family = opts.font || getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const VOLT = "#ceff00", INK = "#f4f4f0", MUTED = "#8f8f89";
  const N = opts.chapters || 6;
  const rand = rng(7);
  const stars = Array.from({ length: 170 }, () => ({ x: rand(), y: rand() * 0.75, r: 0.3 + rand() * 1.3, tw: rand() * TAU, d: 0.3 + rand() * 0.7 }));
  const ridges = [ridge(rng(11), 48, 0.5), ridge(rng(23), 48, 0.48), ridge(rng(41), 48, 0.46, 0.64)];
  const sparks = Array.from({ length: 48 }, () => ({ a: -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.5, v: 0.6 + rand() * 1.8, r: 0.8 + rand() * 2.2, life: 0.35 + rand() * 0.6 }));
  const peakI = ridges[2].indexOf(Math.max(...ridges[2]));
  let embers: { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; ph: number }[] = [];
  let W = 1, H = 1, target = 0, c = 0, raf = 0, last = 0, alive = true;
  let grain: CanvasPattern | null = null;

  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = document.createElement("canvas"); g.width = g.height = 128;
    const gc = g.getContext("2d")!, img = gc.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 9; }
    gc.putImageData(img, 0, 0); grain = ctx.createPattern(g, "repeat");
  }
  const readScroll = () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    target = max > 0 ? (scroller.scrollTop / max) * (N - 1) : 0;
  };

  function drawRidge(h: number[], baseY: number, amp: number, fill: string, rim: string, rimAlpha: number) {
    const n = h.length - 1;
    ctx.beginPath();
    ctx.moveTo(-10, H + 10);
    for (let i = 0; i <= n; i++) ctx.lineTo((i / n) * (W + 20) - 10, baseY - h[i] * amp);
    ctx.lineTo(W + 10, H + 10);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (rimAlpha > 0.01) {
      ctx.save(); ctx.globalAlpha = rimAlpha; ctx.strokeStyle = rim; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) { const x = (i / n) * (W + 20) - 10, y = baseY - h[i] * amp; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    }
  }
  const ridgeY = (h: number[], baseY: number, amp: number, x: number) => { const n = h.length - 1, f = ((x + 10) / (W + 20)) * n, i = clamp(Math.floor(f), 0, n - 1), t = f - i; return baseY - lerp(h[i], h[i + 1], t) * amp; };

  function draw(time: number, dt: number) {
    const S = Math.min(H * 0.26, W * 0.24), G = H * 0.66;
    ctx.clearRect(0, 0, W, H);
    const dawn = bell(c, 3, 0.95), lineCh = bell(c, 4, 0.78), fireCh = clamp(1 - c * 1.05, 0, 1);

    // Sky: black, warming at the stoic dawn, volt-tinted at the line.
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#040404");
    sky.addColorStop(0.55, `rgba(${Math.round(lerp(8, 34, dawn))},${Math.round(lerp(8, 20, dawn) + lineCh * 6)},${Math.round(8 + lineCh * 0)},1)`);
    sky.addColorStop(1, `rgba(${Math.round(lerp(12, 60, dawn))},${Math.round(lerp(12, 32, dawn) + lineCh * 10)},${Math.round(lerp(12, 10, dawn))},1)`);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Stars, drifting with scroll at their own depth.
    const starA = 0.85 * (1 - dawn * 0.85) * (1 - smooth(4.4, 5, c) * 0.4);
    for (const s of stars) {
      const tw = 0.55 + 0.45 * Math.sin(time * 0.0012 * (1 + s.d) + s.tw);
      ctx.globalAlpha = starA * tw * s.d;
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(s.x * W, ((s.y * H - c * 26 * s.d) % H + H) % H, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // IV Stillness: the sun rising behind the mountains.
    const peakX = (peakI / (ridges[2].length - 1)) * (W + 20) - 10;
    if (dawn > 0.01) {
      // the sun rises right behind the peak, so the figure stands against it
      const sunY = lerp(H * 0.92, H * 0.47, smooth(2.2, 3.15, c)), sunR = H * 0.075;
      const halo = ctx.createRadialGradient(peakX, sunY, 0, peakX, sunY, H * 0.8);
      halo.addColorStop(0, `rgba(255,220,160,${0.55 * dawn})`); halo.addColorStop(0.18, `rgba(255,170,80,${0.22 * dawn})`); halo.addColorStop(1, "rgba(255,140,40,0)");
      ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
      const disc = ctx.createRadialGradient(peakX, sunY, 0, peakX, sunY, sunR);
      disc.addColorStop(0, `rgba(255,248,232,${dawn})`); disc.addColorStop(0.85, `rgba(255,236,200,${dawn})`); disc.addColorStop(1, "rgba(255,220,170,0)");
      ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(peakX, sunY, sunR, 0, TAU); ctx.fill();
    }

    // Mountains: three ridges in parallax, rising for the stoic chapter.
    const rise = smooth(1.9, 3, c) * (1 - smooth(3.35, 3.85, c));
    const layers = [
      { h: ridges[0], base: H * 0.6, amp: H * 0.2, depth: 0.35, fill: "#0b0b0b", off: 0 },
      { h: ridges[1], base: H * 0.7, amp: H * 0.22, depth: 0.6, fill: "#090909", off: 0 },
      { h: ridges[2], base: H * 0.82, amp: H * 0.3, depth: 1, fill: "#060606", off: 0 },
    ];
    for (const L of layers) {
      const off = (1 - Math.max(rise, 0.12 * L.depth * (1 - smooth(3.35, 3.85, c)))) * H * 0.62 * L.depth + (c - 3) * 10 * L.depth;
      if (off < H * 0.6) drawRidge(L.h, L.base + off, L.amp, L.fill, "#ffc27a", dawn * (0.15 + 0.35 * L.depth));
      L.off = off;
    }
    // The lone figure on the front peak, still, facing the light.
    const stoic = bell(c, 3, 0.75);
    if (stoic > 0.01) {
      const L = layers[2], px = peakX, py = ridgeY(L.h, L.base + L.off, L.amp, px), s2 = S * 0.9;
      ctx.save(); ctx.shadowColor = "rgba(255,200,120,0.95)"; ctx.shadowBlur = 10 * stoic;
      figure(ctx, pose(STILL, px, 0, s2, py + 2), s2, "#050505", "#050505", stoic);
      ctx.restore();
    }

    // Ground line for the march, the run and the line.
    const groundA = Math.max(bell(c, 1, 1.1), bell(c, 2, 1), bell(c, 4, 1.1)) * (1 - dawn);
    if (groundA > 0.01) {
      const gg = ctx.createLinearGradient(0, 0, W, 0);
      gg.addColorStop(0, "rgba(244,244,240,0)"); gg.addColorStop(0.2, `rgba(244,244,240,${0.22 * groundA})`); gg.addColorStop(0.8, `rgba(244,244,240,${0.22 * groundA})`); gg.addColorStop(1, "rgba(244,244,240,0)");
      ctx.fillStyle = gg; ctx.fillRect(0, G, W, 1.5);
    }

    // I Fire: a campfire, two ancestors in its light, embers rising and turning volt.
    if (fireCh > 0.01) {
      const fx = W * 0.5, fy = G;
      const glow = ctx.createRadialGradient(fx, fy - S * 0.2, 0, fx, fy - S * 0.2, H * 0.55);
      glow.addColorStop(0, `rgba(255,170,60,${0.42 * fireCh})`); glow.addColorStop(0.35, `rgba(255,110,20,${0.12 * fireCh})`); glow.addColorStop(1, "rgba(255,90,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      for (const side of [-1, 1]) {
        const ax = fx + side * S * 1.05;
        ctx.save(); ctx.shadowColor = `rgba(255,150,60,${0.8 * fireCh})`; ctx.shadowBlur = 14;
        const P = pose({ ...STAGES[1], tAmp: 0.08, aAmp: 0.05, lean: 0.75 }, ax, side > 0 ? 2.4 : 0.6, S * 0.85, fy);
        // face the fire
        if (side > 0) { for (const k of ["hip", "neck", "head", "shoulder"] as const) P[k].x = ax - (P[k].x - ax); for (const l of P.legs) { l.k.x = ax - (l.k.x - ax); l.f.x = ax - (l.f.x - ax); } for (const a of P.arms) { a.e.x = ax - (a.e.x - ax); a.h.x = ax - (a.h.x - ax); } }
        figure(ctx, P, S * 0.85, "#16110c", "#100c08", fireCh);
        ctx.restore();
      }
      // logs
      ctx.save(); ctx.globalAlpha = fireCh; ctx.strokeStyle = "#1a1410"; ctx.lineCap = "round"; ctx.lineWidth = S * 0.07;
      ctx.beginPath(); ctx.moveTo(fx - S * 0.32, fy); ctx.lineTo(fx + S * 0.26, fy - S * 0.1); ctx.moveTo(fx + S * 0.32, fy); ctx.lineTo(fx - S * 0.26, fy - S * 0.1); ctx.stroke(); ctx.restore();
      // flames
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 6; k++) {
        const sw = Math.sin(time * 0.006 + k * 1.7) * S * 0.05, hh = S * (0.42 + 0.22 * Math.sin(time * 0.009 + k * 2.3)) * (k === 2 || k === 3 ? 1.25 : 0.85) * fireCh;
        const bx = fx + (k - 2.5) * S * 0.08, bw = S * 0.13;
        const fg = ctx.createLinearGradient(0, fy, 0, fy - hh);
        fg.addColorStop(0, "rgba(255,240,200,0.9)"); fg.addColorStop(0.35, "rgba(255,170,40,0.7)"); fg.addColorStop(1, "rgba(255,70,0,0)");
        ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(bx - bw, fy - 2);
        ctx.quadraticCurveTo(bx - bw * 0.6 + sw, fy - hh * 0.55, bx + sw * 1.6, fy - hh);
        ctx.quadraticCurveTo(bx + bw * 0.6 + sw, fy - hh * 0.55, bx + bw, fy - 2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // embers: always a few drifting; a stream from the fire in chapter I
    if (!reduced) {
      const rate = 0.05 + fireCh * 0.9;
      if (Math.random() < rate * dt * 0.06) embers.push({ x: fireCh > 0.2 ? W * 0.5 + (Math.random() - 0.5) * S * 0.4 : Math.random() * W, y: fireCh > 0.2 ? G - S * 0.2 : H + 4, vx: (Math.random() - 0.5) * 0.02, vy: -(0.025 + Math.random() * 0.05), life: 0, max: 2200 + Math.random() * 2600, r: 0.6 + Math.random() * 1.6, ph: Math.random() * TAU });
    }
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    embers = embers.filter((e) => (e.life += dt) < e.max && e.y > -10);
    for (const e of embers) {
      e.x += (e.vx + Math.sin(time * 0.002 + e.ph) * 0.012) * dt; e.y += e.vy * dt;
      const k = e.life / e.max, a = Math.sin(Math.PI * k);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = k < 0.45 ? "#ffb347" : VOLT; // sparks turn volt as they climb: embers become LIMITLINE's
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1 - k * 0.5), 0, TAU); ctx.fill();
    }
    ctx.restore(); ctx.globalAlpha = 1;

    // II Rise: the march, from all fours to upright, leaving its earlier selves.
    const march = bell(c, 1, 0.95);
    if (march > 0.01) {
      const u = clamp((c - 0.5) / 0.95, 0, 1), s = u * 3, x0 = W * 0.12, x1 = W * 0.84;
      const greys = ["#3a3a37", "#4f4f4b", "#6c6c66"];
      ctx.font = `600 ${Math.max(8, S * 0.075)}px ${family}`; ctx.textAlign = "center";
      try { ctx.letterSpacing = "1px"; } catch { /* older browsers */ }
      for (let kq = 0; kq < 3; kq++) {
        const a = clamp((s - kq - 0.5) * 3, 0, 1) * march;
        if (a <= 0) continue;
        const gx = lerp(x0, x1, kq / 3);
        figure(ctx, pose(stageAt(kq), gx, 0.9, S, G), S, greys[kq], greys[kq], a);
        ctx.globalAlpha = a; ctx.fillStyle = MUTED; ctx.fillText(["6M YRS AGO", "3M YRS AGO", "2M YRS AGO"][kq], gx, G + Math.max(16, S * 0.2)); ctx.globalAlpha = 1;
      }
      try { ctx.letterSpacing = "0px"; } catch { /* older browsers */ }
      const mx = lerp(x0, x1, u);
      figure(ctx, pose(stageAt(s), mx, (mx / S) * 2.3, S, G), S, "#c9c9c2", "#8d8d86", march);
    }

    // III Endurance: a runner at full speed, motion trail, the ground streaming past.
    const run = bell(c, 2, 0.85);
    if (run > 0.01) {
      const u = clamp((c - 1.45) / 1.1, 0, 1), rx = lerp(-S, W + S, u), ph = (rx / S) * 2.6;
      ctx.save(); ctx.globalAlpha = run * 0.35; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.setLineDash([S * 0.25, S * 0.5]); ctx.lineDashOffset = rx * 1.8;
      for (const yy of [G + S * 0.12, G + S * 0.3]) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
      ctx.restore();
      for (let k = 5; k >= 1; k--) figure(ctx, pose(STAGES[3], rx - k * S * 0.32, ph - k * 0.42, S, G), S, VOLT, "#8fb000", run * 0.09 * (6 - k));
      for (let k = 0; k < 7; k++) { ctx.globalAlpha = run * 0.25; ctx.fillStyle = VOLT; ctx.fillRect(rx - S * (0.9 + k * 0.2), G - S * (0.35 + 0.12 * k), S * (0.4 + (k % 3) * 0.2), 1.2); }
      ctx.globalAlpha = 1;
      ctx.save(); ctx.shadowColor = VOLT; ctx.shadowBlur = 18 * run;
      figure(ctx, pose(STAGES[3], rx, ph, S, G), S, VOLT, "#8fb000", run);
      ctx.restore();
    }

    // V The line: the athlete breaks through the limit line.
    if (lineCh > 0.01) {
      const u = clamp((c - 3.45) / 1.05, 0, 1), lx = W * 0.62, top = G - S * 1.35, cross = 0.55;
      const crossed = u >= cross;
      const ax = u < cross ? lerp(W * 0.14, lx + 4, ease(u / cross)) : lerp(lx + 4, W * 0.82, ease((u - cross) / (1 - cross)));
      const st = u < cross ? 3 : 3 + smooth(cross, 1, u);
      if (crossed) {
        const fl = ctx.createRadialGradient(lx, G, 0, lx, G, W * 0.6);
        fl.addColorStop(0, `rgba(206,255,0,${0.22 * lineCh})`); fl.addColorStop(1, "rgba(206,255,0,0)");
        ctx.fillStyle = fl; ctx.fillRect(0, 0, W, H);
      }
      ctx.save(); ctx.globalAlpha = lineCh; ctx.strokeStyle = VOLT; ctx.lineWidth = crossed ? 3 : 2;
      if (crossed) { ctx.shadowColor = VOLT; ctx.shadowBlur = 20; } else ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(lx, G + 8); ctx.lineTo(lx, top); ctx.stroke(); ctx.restore();
      ctx.globalAlpha = lineCh; ctx.fillStyle = crossed ? VOLT : MUTED; ctx.font = `700 ${Math.max(8, S * 0.08)}px ${family}`; ctx.textAlign = "center";
      try { ctx.letterSpacing = "2px"; } catch { /* older browsers */ }
      ctx.fillText("YOUR LIMIT", lx, top - 12);
      try { ctx.letterSpacing = "0px"; } catch { /* older browsers */ }
      ctx.globalAlpha = 1;
      const S2 = S * (1 + 0.12 * clamp(st - 3, 0, 1));
      ctx.save(); ctx.shadowColor = VOLT; ctx.shadowBlur = crossed ? 28 : 8;
      figure(ctx, pose(stageAt(st), ax, st >= 3.9 ? 0.5 : (ax / S) * 2.3, S2, G), S2, VOLT, "#8fb000", lineCh);
      ctx.restore();
      if (crossed) {
        const tau = (u - cross) * 2.4;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const sp of sparks) {
          if (tau > sp.life) continue;
          const k = 1 - tau / sp.life;
          ctx.globalAlpha = k * lineCh; ctx.fillStyle = VOLT;
          ctx.beginPath(); ctx.arc(lx + Math.cos(sp.a) * sp.v * S * tau * 2, G - S * 0.6 + Math.sin(sp.a) * sp.v * S * tau * 2 + S * 2.2 * tau * tau, sp.r * k, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
    }

    // VI You: the mark draws itself, a line and the blade breaking out of it.
    const you = smooth(4.35, 5, c);
    if (you > 0.01) {
      const sc = Math.min(W, H) * 0.0062, ox = W / 2 - 23 * sc, oy = H * 0.3 - 16 * sc;
      const lineP = smooth(4.4, 4.75, c), bladeP = smooth(4.65, 5, c);
      ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc); ctx.globalAlpha = you;
      ctx.fillStyle = "rgba(244,244,240,0.42)";
      ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(21.2 * lineP, 26); ctx.lineTo(21.2 * lineP - 1.7, 29.5); ctx.lineTo(0, 29.5); ctx.closePath(); ctx.fill();
      if (bladeP > 0) {
        const t = bladeP, tx = lerp(22.8, 38.8, t), ty = lerp(29.5, 1, t);
        ctx.shadowColor = VOLT; ctx.shadowBlur = 30 * t; ctx.fillStyle = VOLT;
        ctx.beginPath(); ctx.moveTo(22.8, 29.5); ctx.lineTo(30, 29.5); ctx.lineTo(tx + 7.2, ty); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      const halo = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.7);
      halo.addColorStop(0, `rgba(206,255,0,${0.1 * you})`); halo.addColorStop(1, "rgba(206,255,0,0)");
      ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
    }

    // Film grain and vignette.
    if (grain) { ctx.fillStyle = grain; ctx.fillRect(0, 0, W, H); }
    const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  function frame(now: number) {
    if (!alive) return;
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    readScroll();
    // inertia: the scene follows your finger with a little weight
    c = reduced ? target : c + (target - c) * (1 - Math.pow(0.0008, dt / 1000));
    if (Math.abs(target - c) < 0.0005) c = target;
    draw(now, dt);
    opts.onProgress?.(c);
    raf = requestAnimationFrame(frame);
  }
  size();
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  raf = requestAnimationFrame(frame);
  return { destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); }, progress: () => c };
}
