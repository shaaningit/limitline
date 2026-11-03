// The opening graphic, "march of greatness" (founder, Nov 3): one figure evolves as it moves
// (all fours, stooped, upright, runner), leaving a lineup of its earlier selves, then breaks
// through the volt limit line and stands with arms raised. Canvas, ~6.6 s, tap to skip or replay.
// Browser-only; components/evolution-intro.tsx mounts it. The mini app demo
// (docs/demo/limitline-mini.html) runs the same code.

type Pt = { x: number; y: number };
type Stage = {
  lean: number; // torso from vertical, + is forward (radians)
  headK: number; // head tilt as a share of the lean
  torso: number; // lengths as fractions of the figure size S
  arm: number;
  leg: number;
  tAmp: number; // thigh swing
  kBase: number; // knee bend
  kAmp: number;
  aBase: number; // upper arm from straight down, + is forward
  aAmp: number;
  aSplit: number; // arms apart (the V of the finish)
  eBase: number; // elbow bend
  eAmp: number;
  bob: number;
};
type Pose = { hip: Pt; neck: Pt; head: Pt; shoulder: Pt; legs: { k: Pt; f: Pt }[]; arms: { e: Pt; h: Pt }[] };

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const STAGES: Stage[] = [
  // On all fours (about 6 million years ago)
  { lean: 1.02, headK: 0.62, torso: 0.3, arm: 0.46, leg: 0.36, tAmp: 0.3, kBase: 0.62, kAmp: 0.3, aBase: 0.32, aAmp: 0.3, aSplit: 0, eBase: 0.05, eAmp: 0.08, bob: 0.006 },
  // Stooped walker (about 3 million years ago)
  { lean: 0.62, headK: 0.6, torso: 0.3, arm: 0.36, leg: 0.42, tAmp: 0.36, kBase: 0.42, kAmp: 0.42, aBase: 0.18, aAmp: 0.3, aSplit: 0, eBase: 0.25, eAmp: 0.1, bob: 0.008 },
  // Upright, the first long-distance walkers and runners (about 2 million years ago)
  { lean: 0.1, headK: 0.5, torso: 0.31, arm: 0.33, leg: 0.47, tAmp: 0.42, kBase: 0.1, kAmp: 0.6, aBase: 0.02, aAmp: 0.36, aSplit: 0, eBase: 0.3, eAmp: 0.15, bob: 0.01 },
  // Runner (today)
  { lean: 0.24, headK: 0.35, torso: 0.31, arm: 0.32, leg: 0.48, tAmp: 0.82, kBase: 0.5, kAmp: 1.25, aBase: 0.05, aAmp: 0.95, aSplit: 0, eBase: 1.5, eAmp: 0.15, bob: 0.028 },
  // Beyond the limit: arms up
  { lean: -0.06, headK: 2, torso: 0.31, arm: 0.32, leg: 0.48, tAmp: 0.18, kBase: 0.05, kAmp: 0.1, aBase: Math.PI - 0.12, aAmp: 0, aSplit: 0.36, eBase: -0.04, eAmp: 0, bob: 0 },
];
const LABELS = ["6M years ago", "3M years ago", "2M years ago", "Today", "You"];
const KEYS = Object.keys(STAGES[0]) as (keyof Stage)[];

function stageAt(s: number): Stage {
  const i = clamp(Math.floor(s), 0, STAGES.length - 2);
  const t = ease(clamp(s - i, 0, 1));
  const out = { ...STAGES[i] };
  for (const k of KEYS) out[k] = lerp(STAGES[i][k], STAGES[i + 1][k], t);
  return out;
}

// Joint positions for a body plan at hip x, gait phase ph, figure size S, ground y G.
function pose(p: Stage, x: number, ph: number, S: number, G: number): Pose {
  const up = (ang: number, len: number, from: Pt): Pt => ({ x: from.x + Math.sin(ang) * len * S, y: from.y - Math.cos(ang) * len * S });
  const down = (ang: number, len: number, from: Pt): Pt => ({ x: from.x + Math.sin(ang) * len * S, y: from.y + Math.cos(ang) * len * S });
  const hip = { x: 0, y: 0 };
  const neck = up(p.lean, p.torso, hip);
  const head = up(p.lean * p.headK, 0.11, neck);
  const shoulder = { x: lerp(hip.x, neck.x, 0.94), y: lerp(hip.y, neck.y, 0.94) };
  const legs = [0, Math.PI].map((off) => {
    const phi = ph + off;
    const thigh = p.tAmp * Math.sin(phi);
    const knee = p.kBase + p.kAmp * Math.max(0, Math.cos(phi)) * (p.kAmp > 0.9 ? 1 : 0.9);
    const k = down(thigh, p.leg * 0.5, hip);
    return { k, f: down(thigh - knee, p.leg * 0.5, k) };
  });
  const arms = [0, Math.PI].map((off, i) => {
    const phi = ph + off + Math.PI; // arms swing against legs
    const upper = p.aBase + p.aAmp * Math.sin(phi) + (i === 0 ? -p.aSplit : p.aSplit);
    const e = down(upper, p.arm * 0.5, shoulder);
    return { e, h: down(upper + p.eBase + p.eAmp * Math.cos(phi), p.arm * 0.5, e) };
  });
  // Stand on the lowest foot (and, on all fours, the lowest hand).
  let low = Math.max(legs[0].f.y, legs[1].f.y);
  const handWeight = clamp((p.lean - 0.75) / 0.25, 0, 1);
  if (handWeight > 0) low = Math.max(low, lerp(low, Math.max(arms[0].h.y, arms[1].h.y), handWeight));
  const dy = G - low - p.bob * S * Math.abs(Math.sin(ph));
  const move = (pt: Pt): Pt => ({ x: pt.x + x, y: Math.min(pt.y + dy, G) });
  return {
    hip: move(hip),
    neck: move(neck),
    head: move(head),
    shoulder: move(shoulder),
    legs: legs.map((l) => ({ k: move(l.k), f: move(l.f) })),
    arms: arms.map((a) => ({ e: move(a.e), h: move(a.h) })),
  };
}

function drawFigure(ctx: CanvasRenderingContext2D, P: Pose, S: number, near: string, far: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const limb = (a: Pt, b: Pt, c: Pt, w: number, col: string) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.stroke();
  };
  const w = S * 0.075;
  limb(P.hip, P.legs[1].k, P.legs[1].f, w, far); // far side first, darker, for depth
  limb(P.shoulder, P.arms[1].e, P.arms[1].h, w * 0.9, far);
  ctx.strokeStyle = near;
  ctx.lineWidth = S * 0.12;
  ctx.beginPath();
  ctx.moveTo(P.hip.x, P.hip.y);
  ctx.lineTo(P.neck.x, P.neck.y);
  ctx.stroke();
  limb(P.hip, P.legs[0].k, P.legs[0].f, w, near);
  ctx.fillStyle = near;
  ctx.beginPath();
  ctx.arc(P.head.x, P.head.y, S * 0.068, 0, TAU);
  ctx.fill();
  limb(P.shoulder, P.arms[0].e, P.arms[0].h, w * 0.9, near);
  ctx.restore();
}

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
}

export interface IntroHandle {
  finish(): void;
  replay(): void;
  destroy(): void;
}

export function mountEvolutionIntro(canvas: HTMLCanvasElement, opts: { reducedMotion?: boolean } = {}): IntroHandle {
  const ctx = canvas.getContext("2d")!;
  const VOLT = "#ceff00";
  const MUTED = "#a6a6a0";
  const reduced = opts.reducedMotion ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DUR = 6600;
  // Canvas can't read CSS variables, so use the page's own body font (Nunito via next/font).
  const family = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  let W = 1, H = 1, start: number | null = null, raf = 0, done = false, crossed = false, lastT = 0;
  let ghosts: { k: number; x: number; born: number }[] = [];
  let sparks: { x: number; y: number; vx: number; vy: number; r: number; life: number; t0: number }[] = [];
  let grain: CanvasPattern | null = null;

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = document.createElement("canvas");
    g.width = g.height = 128;
    const gc = g.getContext("2d")!;
    const img = gc.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 10;
    }
    gc.putImageData(img, 0, 0);
    grain = ctx.createPattern(g, "repeat");
  }

  // Layout: figure size, ground, the limit line, and where each stage stands in the lineup.
  const layout = () => ({ S: Math.min(H * 0.6, W * 0.25), G: H * 0.8, x0: W * 0.12, line: W * 0.8, xEnd: W * 0.9 });
  function at(t: number) {
    const { x0, line, xEnd } = layout();
    if (t < 0.8) {
      const u = t / 0.8;
      return { x: lerp(x0, line + 4, u), s: clamp(u * 3.6, 0, 3) };
    }
    const u = easeOut(clamp((t - 0.8) / 0.2, 0, 1));
    return { x: lerp(line + 4, xEnd, u), s: 3 + u };
  }
  const xAtStage = (k: number) => {
    const { x0, line } = layout();
    return lerp(x0, line + 4, k / 3.6);
  };

  function draw(t: number) {
    const { S, G, line } = layout();
    ctx.clearRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(line, G - S * 0.6, 0, line, G - S * 0.6, W * 0.55);
    glow.addColorStop(0, `rgba(206,255,0,${crossed || t >= 0.8 ? 0.16 : 0.06 + 0.06 * t})`);
    glow.addColorStop(1, "rgba(206,255,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const ground = ctx.createLinearGradient(0, 0, W, 0);
    ground.addColorStop(0, "rgba(242,242,238,0)");
    ground.addColorStop(0.15, "rgba(242,242,238,0.22)");
    ground.addColorStop(0.85, "rgba(242,242,238,0.22)");
    ground.addColorStop(1, "rgba(242,242,238,0)");
    ctx.fillStyle = ground;
    ctx.fillRect(0, G, W, 1.5);

    const st = at(t);
    if (!crossed && st.x >= line) {
      crossed = true;
      for (let i = 0; i < 36; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
        const v = S * (0.8 + Math.random() * 1.6);
        sparks.push({ x: line, y: G - S * 0.55 + (Math.random() - 0.5) * S * 0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1 + Math.random() * 2.2, life: 0.5 + Math.random() * 0.6, t0: lastT });
      }
    }
    const lineTop = G - S * 1.25;
    ctx.save();
    ctx.strokeStyle = VOLT;
    ctx.lineWidth = crossed ? 3 : 2;
    ctx.globalAlpha = crossed ? 1 : 0.55 + 0.3 * Math.sin(t * 40);
    if (crossed) {
      ctx.shadowColor = VOLT;
      ctx.shadowBlur = 18;
    } else ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(line, G + 6);
    ctx.lineTo(line, lineTop);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = crossed ? VOLT : MUTED;
    ctx.font = `800 ${Math.max(9, S * 0.085)}px ${family}`;
    ctx.textAlign = "center";
    ctx.fillText("YOUR LIMIT", line, lineTop - 8);

    for (let k = ghosts.length; k < 4; k++) {
      if (st.s >= k + 0.5 || (k === 3 && crossed)) ghosts.push({ k, x: xAtStage(k), born: t });
      else break;
    }
    const greys = ["#3d3d3a", "#55554f", "#74746d", "#9a9a92"];
    const labelFont = `700 ${Math.max(8, S * 0.075)}px ${family}`;
    for (const g of ghosts) {
      const a = clamp((t - g.born) * 6, 0, 1);
      drawFigure(ctx, pose(stageAt(g.k), g.x, 0.9, S, G), S, greys[g.k], greys[g.k], a);
      ctx.globalAlpha = a;
      ctx.fillStyle = MUTED;
      ctx.font = labelFont;
      ctx.fillText(LABELS[g.k].toUpperCase(), g.x, G + Math.max(14, S * 0.16));
      ctx.globalAlpha = 1;
    }

    const S2 = S * (1 + 0.1 * clamp(st.s - 3, 0, 1)); // the athlete grows a little breaking through
    const P = pose(stageAt(st.s), st.x, st.s >= 3.9 ? 0.5 : (st.x / S) * 2.3, S2, G);
    const voltMix = clamp(st.s - 2.2, 0, 1);
    ctx.save();
    if (st.s > 3) {
      ctx.shadowColor = VOLT;
      ctx.shadowBlur = 24 * (st.s - 3);
    }
    drawFigure(ctx, P, S2, mix("#bdbdb5", VOLT, voltMix), mix("#8d8d86", "#8fb000", voltMix), 1);
    ctx.restore();
    if (st.s > 3.6) {
      ctx.globalAlpha = clamp((st.s - 3.6) * 2.5, 0, 1);
      ctx.fillStyle = VOLT;
      ctx.font = labelFont.replace("700", "800");
      ctx.fillText(LABELS[4].toUpperCase(), st.x, G + Math.max(14, S * 0.16));
      ctx.globalAlpha = 1;
    }

    for (const sp of sparks) {
      const age = ((t - sp.t0) * DUR) / 1000;
      if (age < 0 || age > sp.life) continue;
      const k = 1 - age / sp.life;
      ctx.globalAlpha = k;
      ctx.fillStyle = VOLT;
      ctx.beginPath();
      ctx.arc(sp.x + sp.vx * age, sp.y + sp.vy * age + 120 * age * age, sp.r * k, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (grain) {
      ctx.fillStyle = grain;
      ctx.fillRect(0, 0, W, H);
    }
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    lastT = t;
  }

  function frame(now: number) {
    if (start === null) start = now;
    const t = clamp((now - start) / DUR, 0, 1);
    draw(t);
    if (t < 1 && !done) raf = requestAnimationFrame(frame);
    else done = true;
  }
  function finish() {
    cancelAnimationFrame(raf);
    done = true;
    crossed = true;
    ghosts = [0, 1, 2, 3].map((k) => ({ k, x: xAtStage(k), born: -1 }));
    sparks = [];
    draw(1);
  }
  function replay() {
    cancelAnimationFrame(raf);
    done = false;
    crossed = false;
    ghosts = [];
    sparks = [];
    start = null;
    lastT = 0;
    raf = requestAnimationFrame(frame);
  }
  const onClick = () => (done ? replay() : finish());

  size();
  const ro = new ResizeObserver(() => {
    size();
    if (done) finish();
  });
  ro.observe(canvas);
  canvas.addEventListener("click", onClick);
  if (reduced) finish();
  else raf = requestAnimationFrame(frame);

  return {
    finish,
    replay,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("click", onClick);
    },
  };
}
