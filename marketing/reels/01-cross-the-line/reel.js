// LIMITLINE ad reel: 24 s, 1080x1920, every frame drawn from vectors (no images, no pixel art).
// Explainer-style CGI look: clay-shaded mannequin, soft studio light, contact shadows,
// camera pushes, word-by-word captions. render(ctx, t) is a pure function of time, so the same
// code plays live in a page and exports frame-exact video.
(function () {
  const W = 1080, H = 1920, DUR = 24;
  const TAU = Math.PI * 2;
  const VOLT = "#ceff00", INK = "#f4f4f0";
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeOutBack = (t) => { t = clamp(t, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------- Mannequin (articulated, clay-shaded) ----------
  const RUN = { lean: 0.22, headK: 0.3, torso: 0.31, arm: 0.33, leg: 0.5, tAmp: 0.82, kBase: 0.5, kAmp: 1.25, aBase: 0.05, aAmp: 0.95, eBase: 1.45, eAmp: 0.15, bob: 0.03 };
  const JOG = { lean: 0.12, headK: 0.3, torso: 0.31, arm: 0.33, leg: 0.5, tAmp: 0.5, kBase: 0.35, kAmp: 0.9, aBase: 0.05, aAmp: 0.6, eBase: 1.5, eAmp: 0.1, bob: 0.02 };
  const mixPose = (a, b, t) => { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], t); return o; };
  function pose(p, x, ph, S, G) {
    const up = (a, l, f) => ({ x: f.x + Math.sin(a) * l * S, y: f.y - Math.cos(a) * l * S });
    const down = (a, l, f) => ({ x: f.x + Math.sin(a) * l * S, y: f.y + Math.cos(a) * l * S });
    const hip = { x: 0, y: 0 }, neck = up(p.lean, p.torso, hip), head = up(p.lean * p.headK, 0.12, neck);
    const shoulder = { x: neck.x * 0.92, y: neck.y * 0.92 };
    const legs = [0, Math.PI].map((o) => { const f = ph + o, th = p.tAmp * Math.sin(f), kn = p.kBase + p.kAmp * Math.max(0, Math.cos(f)), k = down(th, p.leg * 0.5, hip); return { k, f: down(th - kn, p.leg * 0.5, k) }; });
    const arms = [0, Math.PI].map((o) => { const f = ph + o + Math.PI, u = p.aBase + p.aAmp * Math.sin(f), e = down(u, p.arm * 0.5, shoulder); return { e, h: down(u + p.eBase + p.eAmp * Math.cos(f), p.arm * 0.5, e) }; });
    const low = Math.max(legs[0].f.y, legs[1].f.y);
    const dy = G - low - p.bob * S * Math.abs(Math.sin(ph));
    const mv = (q) => ({ x: q.x + x, y: q.y + dy });
    return { hip: mv(hip), neck: mv(neck), head: mv(head), shoulder: mv(shoulder), legs: legs.map((l) => ({ k: mv(l.k), f: mv(l.f) })), arms: arms.map((a) => ({ e: mv(a.e), h: mv(a.h) })) };
  }
  // A limb segment shaded like a lit cylinder: light from the upper left.
  function capsule(ctx, a, b, r, tone) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len, ny = dx / len;
    if (nx * -0.6 + ny * -0.8 < 0) { nx = -nx; ny = -ny; } // normal pointing at the light
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const g = ctx.createLinearGradient(mx + nx * r, my + ny * r, mx - nx * r, my - ny * r);
    g.addColorStop(0, tone.hi); g.addColorStop(0.35, tone.mid); g.addColorStop(0.85, tone.lo); g.addColorStop(1, tone.rim || tone.lo);
    ctx.strokeStyle = g; ctx.lineWidth = r * 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  function sphere(ctx, x, y, r, tone) {
    const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
    g.addColorStop(0, tone.hi); g.addColorStop(0.5, tone.mid); g.addColorStop(1, tone.lo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  const CLAY = { hi: "#f1f0ea", mid: "#c9c8c0", lo: "#6f6e68", rim: "#8d8c84" };
  const CLAY_FAR = { hi: "#bdbcb5", mid: "#97968f", lo: "#4e4d48", rim: "#5e5d58" };
  const CLAY_VOLT = { hi: "#f7ffd0", mid: "#ceff00", lo: "#6e8a00", rim: "#9cc400" };
  function mannequin(ctx, P, S, near = CLAY, far = CLAY_FAR) {
    const lr = S * 0.046, tr = S * 0.085;
    // far side
    capsule(ctx, P.hip, P.legs[1].k, lr * 1.15, far); capsule(ctx, P.legs[1].k, P.legs[1].f, lr, far);
    capsule(ctx, P.shoulder, P.arms[1].e, lr * 0.92, far); capsule(ctx, P.arms[1].e, P.arms[1].h, lr * 0.82, far);
    // torso and head
    capsule(ctx, P.hip, P.neck, tr, near);
    sphere(ctx, P.hip.x, P.hip.y, tr * 0.95, near);
    capsule(ctx, P.neck, { x: lerp(P.neck.x, P.head.x, 0.5), y: lerp(P.neck.y, P.head.y, 0.5) }, lr * 0.8, near);
    sphere(ctx, P.head.x, P.head.y, S * 0.078, near);
    // near side
    capsule(ctx, P.hip, P.legs[0].k, lr * 1.15, near); capsule(ctx, P.legs[0].k, P.legs[0].f, lr, near);
    sphere(ctx, P.legs[0].k.x, P.legs[0].k.y, lr * 1.08, near);
    capsule(ctx, P.shoulder, P.arms[0].e, lr * 0.92, near); capsule(ctx, P.arms[0].e, P.arms[0].h, lr * 0.82, near);
    sphere(ctx, P.arms[0].h.x, P.arms[0].h.y, lr * 0.95, near);
  }
  function contactShadow(ctx, x, y, w, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, w);
    g.addColorStop(0, `rgba(0,0,0,${0.55 * a})`); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.16); ctx.translate(-x, -y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w, 0, TAU); ctx.fill(); ctx.restore();
  }
  function studio(ctx, G, tint = [206, 255, 0], tintA = 0.05) {
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.4, H * 0.85);
    bg.addColorStop(0, "#26282b"); bg.addColorStop(0.55, "#121314"); bg.addColorStop(1, "#060606");
    ctx.fillStyle = bg; ctx.fillRect(-W, -H, W * 3, H * 3);
    const tg = ctx.createRadialGradient(W * 0.5, G, 0, W * 0.5, G, W);
    tg.addColorStop(0, `rgba(${tint.join(",")},${tintA})`); tg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tg; ctx.fillRect(-W, -H, W * 3, H * 3);
    const fl = ctx.createLinearGradient(0, G, 0, H * 1.4);
    fl.addColorStop(0, "#1b1c1e"); fl.addColorStop(1, "#050505");
    ctx.fillStyle = fl; ctx.fillRect(-W, G, W * 3, H * 2);
    const hz = ctx.createLinearGradient(0, G - 40, 0, G + 40);
    hz.addColorStop(0, "rgba(255,255,255,0)"); hz.addColorStop(0.5, "rgba(255,255,255,0.07)"); hz.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hz; ctx.fillRect(-W, G - 40, W * 3, 80);
  }

  // ---------- Captions: big, bold, word by word, keywords in volt ----------
  const CAPTIONS = [
    { a: 0.25, b: 3.1, words: "What happens when you *BEAT* your own *LIMIT?*" },
    { a: 3.3, b: 5.5, words: "Your limit is just a *LINE.*" },
    { a: 5.6, b: 7.0, words: "Cross it *ONCE...*" },
    { a: 7.25, b: 10.9, words: "Your heart pumps up to *20 LITRES* of blood a minute" },
    { a: 11.05, b: 14.4, words: "Your muscles *ADAPT* and come back *STRONGER*" },
    { a: 14.65, b: 18.4, words: "*LIMITLINE* measures you against your *OWN* best" },
    { a: 18.6, b: 21.4, words: "Earn *EMBERS.* Spend them on *REAL GEAR.*" },
  ];
  function captions(ctx, t, fontFamily) {
    const cap = CAPTIONS.find((c) => t >= c.a && t <= c.b);
    if (!cap) return;
    const tokens = cap.words.split(" ").map((w) => ({ hot: w.startsWith("*") || w.endsWith("*"), w: w.replace(/\*/g, "") }));
    const per = Math.min(0.24, (cap.b - cap.a - 0.6) / tokens.length);
    ctx.save();
    ctx.font = `900 84px ${fontFamily}`;
    try { ctx.fontStretch = "semi-expanded"; } catch { /* older browsers */ }
    ctx.textBaseline = "alphabetic";
    // wrap into lines
    const maxW = 900, lines = [[]];
    let lw = 0;
    for (const tk of tokens) {
      const w = ctx.measureText(tk.w + " ").width;
      if (lw + w > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push({ ...tk, width: w }); lw += w;
    }
    const lh = 96, top = H * 0.735 - (lines.length * lh) / 2;
    const out = smooth(cap.b - 0.18, cap.b, t);
    let i = 0;
    lines.forEach((line, li) => {
      const total = line.reduce((s, x) => s + x.width, 0);
      let x = (W - total) / 2;
      for (const tk of line) {
        const t0 = cap.a + i * per, k = clamp((t - t0) / 0.16, 0, 1);
        i++;
        if (k <= 0) { x += tk.width; continue; }
        const s = easeOutBack(k) * (1 - out * 0.2);
        const y = top + li * lh + lh * 0.8;
        ctx.save();
        ctx.translate(x + tk.width / 2, y - 30);
        ctx.scale(s, s);
        ctx.globalAlpha = Math.min(1, k * 1.4) * (1 - out);
        ctx.lineJoin = "round";
        ctx.lineWidth = 16; ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.strokeText(tk.w, -tk.width / 2, 30);
        ctx.shadowColor = tk.hot ? "rgba(206,255,0,0.55)" : "rgba(0,0,0,0.6)"; ctx.shadowBlur = tk.hot ? 26 : 10;
        ctx.fillStyle = tk.hot ? VOLT : INK;
        ctx.fillText(tk.w, -tk.width / 2, 30);
        ctx.restore();
        x += tk.width;
      }
    });
    ctx.restore();
  }

  // ---------- Scene A: the run and the line (0 to 7 s) ----------
  const shards = (() => { const r = rng(5); return Array.from({ length: 46 }, () => ({ y: r() * 700, vx: 120 + r() * 520, vy: -260 + r() * 420, rot: r() * TAU, vr: (r() - 0.5) * 9, s: 14 + r() * 36, k: r() })); })();
  const TC = 5.93; // the moment the runner crosses the line
  function sceneRun(ctx, t, fontFamily) {
    const G = 1300, S = 560, rx = 430;
    // camera: push in, then a punch at the crossing
    const punch = Math.exp(-Math.max(0, t - TC) * 3) * smooth(TC - 0.05, TC + 0.02, t);
    const zoom = lerp(1, 1.1, smooth(0, 5.5, t)) + punch * 0.12;
    const shake = punch * 10 * Math.sin(t * 90);
    ctx.save();
    ctx.translate(W / 2 + shake, H * 0.55);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H * 0.55);
    studio(ctx, G, [206, 255, 0], 0.03 + 0.12 * smooth(TC - 0.2, TC + 0.4, t));
    // slow motion after the crossing
    const tw = t < TC ? t : TC + (t - TC) * 0.35;
    // floor marks streaming past (speed lines in perspective)
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const y = G + 30 + i * i * 4.5, sp = 900 * (1 + i * 0.15);
      const off = (tw * sp) % 260;
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + i * 0.006})`; ctx.lineWidth = 2 + i * 0.4;
      for (let x = -260 - off; x < W + 260; x += 260) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90 + i * 6, y); ctx.stroke(); }
    }
    ctx.restore();
    // the limit line: a glowing gate sliding toward the runner
    const lx = 1250 - Math.max(0, tw - 3.2) * 300, crossed = t >= TC;
    if (lx < W + 200 && !crossed) {
      ctx.save();
      const gl = ctx.createLinearGradient(lx - 60, 0, lx + 60, 0);
      gl.addColorStop(0, "rgba(206,255,0,0)"); gl.addColorStop(0.5, "rgba(206,255,0,0.35)"); gl.addColorStop(1, "rgba(206,255,0,0)");
      ctx.fillStyle = gl; ctx.fillRect(lx - 60, G - 700, 120, 740);
      ctx.fillStyle = VOLT; ctx.shadowColor = VOLT; ctx.shadowBlur = 40; ctx.fillRect(lx - 4, G - 700, 8, 740);
      ctx.beginPath(); ctx.ellipse(lx, G + 20, 70, 12, 0, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0; ctx.font = `800 40px ${fontFamily}`; ctx.textAlign = "center";
      try { ctx.letterSpacing = "6px"; } catch { /* older browsers */ }
      ctx.fillText("YOUR LIMIT", lx, G - 730);
      ctx.restore();
    }
    // shards of the broken line, flying past in slow motion
    if (crossed) {
      const tau = (t - TC) * 0.6;
      ctx.save();
      for (const s of shards) {
        const x = rx + 40 + s.vx * tau, y = G - 800 + s.y + s.vy * tau + 300 * tau * tau;
        ctx.save(); ctx.translate(x, y); ctx.rotate(s.rot + s.vr * tau);
        ctx.globalAlpha = clamp(1 - tau * 0.7, 0, 1);
        const g = ctx.createLinearGradient(-s.s, -s.s, s.s, s.s); g.addColorStop(0, "#f7ffd0"); g.addColorStop(0.5, VOLT); g.addColorStop(1, "#5f7700");
        ctx.fillStyle = g; ctx.shadowColor = VOLT; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.moveTo(-s.s, -s.s * 0.4); ctx.lineTo(s.s * 0.8, -s.s * 0.7); ctx.lineTo(s.s * 0.3, s.s); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    // the runner: jogging, then a full sprint as the line gets close; volt once across
    const sprint = smooth(4.2, 5.6, t);
    const p = mixPose(JOG, RUN, sprint);
    const ph = tw * TAU * lerp(1.3, 1.75, sprint);
    const P = pose(p, rx, ph, S, G);
    contactShadow(ctx, rx + 20, G + 8, 220, 1);
    const glow = smooth(TC, TC + 0.5, t);
    if (glow > 0) { ctx.save(); ctx.shadowColor = VOLT; ctx.shadowBlur = 50 * glow; }
    mannequin(ctx, P, S, glow > 0.5 ? CLAY_VOLT : CLAY, CLAY_FAR);
    if (glow > 0) ctx.restore();
    ctx.restore();

    // HUD: the time on the athlete's limit, flipping as they cross
    ctx.save();
    const hud = smooth(1.0, 1.6, t);
    ctx.globalAlpha = hud;
    ctx.font = `700 34px ${fontFamily}`; ctx.fillStyle = "rgba(244,244,240,0.6)";
    try { ctx.letterSpacing = "5px"; } catch { /* older browsers */ }
    ctx.fillText("5 KM · YOUR BEST", 90, 250);
    try { ctx.letterSpacing = "0px"; } catch { /* older browsers */ }
    const flip = smooth(TC, TC + 0.25, t);
    ctx.font = `900 150px ${fontFamily}`;
    try { ctx.fontStretch = "semi-expanded"; } catch { /* older browsers */ }
    ctx.fillStyle = flip > 0.5 ? VOLT : INK;
    if (flip > 0.5) { ctx.shadowColor = VOLT; ctx.shadowBlur = 40; }
    ctx.save(); ctx.translate(90, 400); ctx.scale(1, flip > 0 && flip < 1 ? Math.abs(Math.cos(flip * Math.PI)) : 1);
    ctx.fillText(flip > 0.5 ? "24:58" : "25:58", 0, 0); ctx.restore();
    if (t > TC + 0.3) { ctx.shadowBlur = 0; ctx.globalAlpha = hud * smooth(TC + 0.3, TC + 0.6, t); ctx.font = `800 54px ${fontFamily}`; ctx.fillText("+3.9% beyond your limit", 94, 480); }
    ctx.restore();
    // a volt flash at the instant of crossing
    const flash = Math.exp(-Math.max(0, t - TC) * 9) * (t >= TC ? 1 : 0);
    if (flash > 0.01) { ctx.fillStyle = `rgba(206,255,0,${0.35 * flash})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- Scene B: inside, the heart (7 to 11 s) ----------
  const cells = (() => { const r = rng(9); return Array.from({ length: 90 }, () => ({ path: Math.floor(r() * 5), o: r(), s: 0.6 + r() * 0.6 })); })();
  function heartPath(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 1.05, -s * 0.25, -s * 0.55, -s * 1.0, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.55, -s * 1.0, s * 1.05, -s * 0.25, 0, s * 0.35);
    ctx.closePath();
  }
  function sceneHeart(ctx, t, fontFamily) {
    const u = t - 7;
    const zoom = lerp(1.55, 1, easeOut(u / 1.1));
    ctx.save();
    ctx.translate(W / 2, H * 0.42); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H * 0.42);
    const bg = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.42, H * 0.8);
    bg.addColorStop(0, "#1a1011"); bg.addColorStop(0.6, "#0a0707"); bg.addColorStop(1, "#040303");
    ctx.fillStyle = bg; ctx.fillRect(-W, -H, W * 3, H * 3);
    // the body as an x-ray glass silhouette
    ctx.save();
    ctx.strokeStyle = "rgba(206,255,0,0.35)"; ctx.lineWidth = 4; ctx.shadowColor = VOLT; ctx.shadowBlur = 20;
    ctx.fillStyle = "rgba(206,255,0,0.035)";
    ctx.beginPath(); ctx.ellipse(W / 2, 330, 120, 140, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W / 2 - 90, 480); ctx.bezierCurveTo(W / 2 - 330, 520, W / 2 - 360, 640, W / 2 - 340, 1050);
    ctx.lineTo(W / 2 - 250, 1500); ctx.lineTo(W / 2 + 250, 1500); ctx.lineTo(W / 2 + 340, 1050);
    ctx.bezierCurveTo(W / 2 + 360, 640, W / 2 + 330, 520, W / 2 + 90, 480); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // vessels with blood flowing through them
    const hx = W / 2 + 40, hy = 820;
    const paths = [
      [hx, hy - 120, hx + 30, 560, hx - 60, 470],
      [hx - 40, hy - 60, W / 2 - 250, 700, W / 2 - 330, 1000],
      [hx + 60, hy - 60, W / 2 + 260, 700, W / 2 + 330, 1000],
      [hx - 20, hy + 120, W / 2 - 120, 1150, W / 2 - 170, 1480],
      [hx + 30, hy + 120, W / 2 + 120, 1150, W / 2 + 170, 1480],
    ];
    for (const [ax, ay, cx, cy, bx, by] of paths) {
      const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, "#c8262b"); g.addColorStop(1, "rgba(120,20,24,0.3)");
      ctx.strokeStyle = g; ctx.lineWidth = 34; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(cx, cy, bx, by); ctx.stroke();
      ctx.strokeStyle = "rgba(255,190,190,0.25)"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(ax - 8, ay - 6); ctx.quadraticCurveTo(cx - 8, cy - 6, bx - 8, by - 6); ctx.stroke();
    }
    for (const c of cells) {
      const [ax, ay, cx, cy, bx, by] = paths[c.path];
      const q = (c.o + u * 0.55 * c.s) % 1;
      const x = (1 - q) * (1 - q) * ax + 2 * (1 - q) * q * cx + q * q * bx, y = (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * cy + q * q * by;
      ctx.save(); ctx.translate(x, y);
      const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11); g.addColorStop(0, "#ff8a8a"); g.addColorStop(1, "#8f0f17");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 11 * c.s, 7 * c.s, q * 6, 0, TAU); ctx.fill(); ctx.restore();
    }
    // the heart: lub-dub at 150 beats a minute
    const ph = (u % 0.4) / 0.4, beat = Math.exp(-Math.pow(ph - 0.05, 2) / 0.002) + 0.6 * Math.exp(-Math.pow(ph - 0.28, 2) / 0.002);
    const s = 210 * (1 + beat * 0.08) * easeOutBack(u / 0.6);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.25);
    ctx.shadowColor = "rgba(255,40,40,0.6)"; ctx.shadowBlur = 60 + beat * 50;
    const hg = ctx.createRadialGradient(-s * 0.35, -s * 0.45, s * 0.05, 0, -s * 0.1, s * 1.1);
    hg.addColorStop(0, "#ff9a8e"); hg.addColorStop(0.35, "#e23a37"); hg.addColorStop(0.8, "#8c1419"); hg.addColorStop(1, "#4d070b");
    ctx.fillStyle = hg; heartPath(ctx, s); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.5; ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(-s * 0.42, -s * 0.55, s * 0.16, s * 0.07, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
    // a gauge filling to 20 L/min
    const fill = easeOut((u - 0.6) / 2.4);
    ctx.save(); ctx.translate(W - 210, 300);
    ctx.lineWidth = 18; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.arc(0, 0, 110, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
    ctx.strokeStyle = VOLT; ctx.shadowColor = VOLT; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(0, 0, 110, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * fill); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.font = `900 76px ${fontFamily}`;
    ctx.fillText(String(Math.round(20 * fill)), 0, 18);
    ctx.font = `700 26px ${fontFamily}`; ctx.fillStyle = "rgba(244,244,240,0.6)"; ctx.fillText("LITRES / MIN", 0, 62);
    ctx.restore();
  }

  // ---------- Scene C: muscle adapting (11 to 14.5 s) ----------
  const tears = (() => { const r = rng(13); return Array.from({ length: 16 }, () => ({ f: Math.floor(r() * 7), x: 0.15 + r() * 0.7, d: r() * 0.6 })); })();
  function sceneMuscle(ctx, t, fontFamily) {
    const u = t - 11;
    const zoom = lerp(1.35, 1, easeOut(u / 0.9));
    ctx.save();
    ctx.translate(W / 2, H * 0.42); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H * 0.42);
    const bg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, H * 0.8);
    bg.addColorStop(0, "#1a1214"); bg.addColorStop(1, "#050404");
    ctx.fillStyle = bg; ctx.fillRect(-W, -H, W * 3, H * 3);
    const strain = smooth(0.3, 1.2, u) * (1 - smooth(1.8, 2.4, u));
    const grow = smooth(1.9, 3.0, u);
    const cx = W / 2, cy = 820, len = 880;
    // tendons
    for (const side of [-1, 1]) {
      capsule(ctx, { x: cx + side * (len / 2 - 20), y: cy }, { x: cx + side * (len / 2 + 120), y: cy + side * 0 }, 46, { hi: "#ffffff", mid: "#e6e1d6", lo: "#9c968a" });
    }
    // fibres: a bundle of shaded cylinders that bulge, strain and thicken
    for (let f = 0; f < 7; f++) {
      const off = (f - 3) * (64 + grow * 8), bulge = (1 - Math.abs(f - 3) / 4) * (40 + strain * 30 + grow * 26);
      const r = 30 + grow * 6;
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const q = i / 24, x = cx - len / 2 + q * len, b = Math.sin(q * Math.PI);
        pts.push({ x, y: cy + off * (0.55 + 0.45 * b) + Math.sign(off) * bulge * b * 0.6 });
      }
      const tone = { hi: "#ffb3a7", mid: "#e05b55", lo: "#7d1d22", rim: "#a83a3e" };
      for (let i = 0; i < pts.length - 1; i++) capsule(ctx, pts[i], pts[i + 1], r, tone);
      ctx.strokeStyle = "rgba(255,220,210,0.35)"; ctx.lineWidth = 4;
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x - 6, p.y - r * 0.5) : ctx.moveTo(p.x - 6, p.y - r * 0.5))); ctx.stroke();
    }
    // micro-tears glow while straining, then close
    const tearA = smooth(0.6, 1.1, u) * (1 - smooth(1.7, 2.3, u));
    if (tearA > 0) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const tr of tears) {
        const x = cx - len / 2 + tr.x * len, y = cy + (tr.f - 3) * 64;
        ctx.globalAlpha = tearA * (0.6 + 0.4 * Math.sin(u * 20 + tr.d * 10));
        ctx.strokeStyle = "#fff3c0"; ctx.lineWidth = 4; ctx.shadowColor = "#ffcf5a"; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(x - 14, y - 10); ctx.lineTo(x, y + 4); ctx.lineTo(x + 12, y - 8); ctx.stroke();
      }
      ctx.restore();
    }
    // a volt sweep of light as it comes back stronger
    if (grow > 0 && grow < 1) {
      const sx = cx - len / 2 + grow * (len + 200) - 100;
      const sg = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
      sg.addColorStop(0, "rgba(206,255,0,0)"); sg.addColorStop(0.5, "rgba(206,255,0,0.45)"); sg.addColorStop(1, "rgba(206,255,0,0)");
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = sg; ctx.fillRect(sx - 120, cy - 360, 240, 720); ctx.restore();
    }
    ctx.restore();
    // labels like a 3D explainer
    const tag = (label, x, y, a) => {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = `800 34px ${fontFamily}`; const w = ctx.measureText(label).width + 44;
      ctx.fillStyle = "rgba(12,12,12,0.75)"; ctx.strokeStyle = VOLT; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - w / 2, y - 34, w, 62, 31); ctx.fill(); ctx.stroke();
      ctx.fillStyle = VOLT; ctx.textAlign = "center"; ctx.fillText(label, x, y + 9); ctx.restore();
    };
    tag("STRAIN", W * 0.3, 430, smooth(0.5, 0.8, u) * (1 - smooth(1.8, 2.1, u)));
    tag("STRONGER", W * 0.68, 430, smooth(2.2, 2.5, u));
  }

  // ---------- Phone with the app (14.5 to 21.5 s) ----------
  function phone(ctx, x, y, s, rot, t, fontFamily, mode) {
    const w = 520, h = 1060;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    // body with a bevelled edge
    ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 80; ctx.shadowOffsetY = 40;
    const body = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    body.addColorStop(0, "#3a3b3e"); body.addColorStop(0.5, "#18191b"); body.addColorStop(1, "#2a2b2e");
    ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 76); ctx.fill();
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 3; ctx.stroke();
    // screen
    const sw = w - 34, sh = h - 34;
    ctx.save(); ctx.beginPath(); ctx.roundRect(-sw / 2, -sh / 2, sw, sh, 62); ctx.clip();
    const sg = ctx.createRadialGradient(0, -sh * 0.2, 0, 0, -sh * 0.1, sh * 0.8); sg.addColorStop(0, "#161a0c"); sg.addColorStop(1, "#0b0b0b");
    ctx.fillStyle = sg; ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.roundRect(-70, -sh / 2 + 22, 140, 38, 19); ctx.fill();
    // app UI
    ctx.fillStyle = "rgba(244,244,240,0.42)"; ctx.beginPath(); ctx.moveTo(-sw / 2 + 40, -sh / 2 + 132); ctx.lineTo(-sw / 2 + 74, -sh / 2 + 132); ctx.lineTo(-sw / 2 + 71, -sh / 2 + 138); ctx.lineTo(-sw / 2 + 40, -sh / 2 + 138); ctx.fill();
    ctx.fillStyle = VOLT; ctx.beginPath(); ctx.moveTo(-sw / 2 + 77, -sh / 2 + 138); ctx.lineTo(-sw / 2 + 89, -sh / 2 + 138); ctx.lineTo(-sw / 2 + 115, -sh / 2 + 92); ctx.lineTo(-sw / 2 + 103, -sh / 2 + 92); ctx.fill();
    ctx.fillStyle = INK; ctx.font = `800 30px ${fontFamily}`; ctx.fillText("LIMITLINE", -sw / 2 + 128, -sh / 2 + 136);
    ctx.font = `800 46px ${fontFamily}`; ctx.fillText("My quests", -sw / 2 + 40, -sh / 2 + 230);
    // result card
    const cy = -sh / 2 + 280;
    ctx.fillStyle = "#151515"; ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-sw / 2 + 30, cy, sw - 60, 330, 30); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(244,244,240,0.55)"; ctx.font = `600 26px ${fontFamily}`; ctx.fillText("5 km run · 24:58 · synced", -sw / 2 + 58, cy + 56);
    const pct = mode === "count" ? (3.9 * easeOut(clamp((t - 15.4) / 1.2, 0, 1))).toFixed(1) : "3.9";
    ctx.fillStyle = VOLT; ctx.shadowColor = VOLT; ctx.shadowBlur = 24; ctx.font = `900 120px ${fontFamily}`; ctx.fillText(`+${pct}%`, -sw / 2 + 54, cy + 178);
    ctx.shadowBlur = 0; ctx.fillStyle = INK; ctx.font = `600 30px ${fontFamily}`; ctx.fillText("beyond your limit", -sw / 2 + 58, cy + 232);
    ctx.fillStyle = "rgba(206,255,0,0.14)"; ctx.strokeStyle = "rgba(206,255,0,0.45)";
    ctx.beginPath(); ctx.roundRect(-sw / 2 + 56, cy + 256, 250, 50, 25); ctx.fill(); ctx.stroke();
    ctx.fillStyle = VOLT; ctx.font = `800 26px ${fontFamily}`; ctx.fillText("2× embers · +20", -sw / 2 + 78, cy + 290);
    // limit chart: a dashed limit, a line breaking above it
    const ch = cy + 400;
    ctx.fillStyle = "#151515"; ctx.beginPath(); ctx.roundRect(-sw / 2 + 30, ch, sw - 60, 260, 30); ctx.fill();
    ctx.fillStyle = "rgba(244,244,240,0.55)"; ctx.font = `600 24px ${fontFamily}`; ctx.fillText("YOUR LIMIT, 8 WEEKS", -sw / 2 + 58, ch + 50);
    ctx.setLineDash([10, 10]); ctx.strokeStyle = "rgba(244,244,240,0.35)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-sw / 2 + 58, ch + 170); ctx.lineTo(sw / 2 - 58, ch + 170); ctx.stroke(); ctx.setLineDash([]);
    const prog = mode === "count" ? clamp((t - 15.0) / 1.6, 0, 1) : 1;
    ctx.strokeStyle = VOLT; ctx.lineWidth = 6; ctx.shadowColor = VOLT; ctx.shadowBlur = 16; ctx.lineJoin = "round";
    ctx.beginPath();
    const pts = [[0, 200], [0.18, 190], [0.32, 205], [0.5, 185], [0.66, 178], [0.8, 160], [1, 110]];
    pts.forEach(([q, py], i) => { if (q > prog) return; const px = -sw / 2 + 58 + q * (sw - 116); if (i) ctx.lineTo(px, ch + py); else ctx.moveTo(px, ch + py); });
    ctx.stroke(); ctx.shadowBlur = 0;
    // glass reflection sweep
    const gx = ((t * 0.5) % 1.6 - 0.3) * sw;
    const rg = ctx.createLinearGradient(gx - 160, -sh / 2, gx + 160, sh / 2);
    rg.addColorStop(0, "rgba(255,255,255,0)"); rg.addColorStop(0.5, "rgba(255,255,255,0.06)"); rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg; ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
    ctx.restore();
    ctx.restore();
  }
  function scenePhone(ctx, t, fontFamily) {
    const u = t - 14.5;
    studio(ctx, 1350, [206, 255, 0], 0.08);
    const k = easeOutBack(u / 0.9);
    const y = lerp(H + 700, 800, k), rot = lerp(0.5, -0.06, easeOut(u / 1.1)) + Math.sin(u * 1.6) * 0.015;
    contactShadow(ctx, W / 2, 1340, 300 * clamp(k, 0, 1), 0.9);
    phone(ctx, W / 2, y + Math.sin(u * 2) * 8, lerp(0.75, 0.94, easeOut(u / 1.2)), rot, t, fontFamily, "count");
  }

  // ---------- Scene E: embers fly into the shop (18.5 to 21.5 s) ----------
  const gems = (() => { const r = rng(21); return Array.from({ length: 16 }, () => ({ d: r() * 1.1, a: (r() - 0.5) * 0.9, h: 300 + r() * 380, s: 0.7 + r() * 0.6 })); })();
  function gem(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.shadowColor = VOLT; ctx.shadowBlur = 24;
    ctx.fillStyle = "#b6e600"; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(32, -6); ctx.lineTo(0, 44); ctx.lineTo(-32, -6); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f2ffc2"; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(-32, -6); ctx.lineTo(-8, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ceff00"; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(-8, -6); ctx.lineTo(10, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#7a9900"; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(32, -6); ctx.lineTo(0, 44); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function bag(ctx, x, y, s, bounce) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 + bounce * 0.06), s * (1 - bounce * 0.05));
    ctx.strokeStyle = "#dfe0d8"; ctx.lineWidth = 22; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0, -150, 92, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    const g = ctx.createLinearGradient(-200, -170, 200, 200); g.addColorStop(0, "#f2f2ec"); g.addColorStop(0.5, "#c7c6bf"); g.addColorStop(1, "#6f6e68");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-190, -160); ctx.lineTo(190, -160); ctx.lineTo(220, 200); ctx.lineTo(-220, 200); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(-190, -160, 380, 26);
    ctx.fillStyle = VOLT; ctx.beginPath(); ctx.moveTo(-26, 40); ctx.lineTo(-6, 40); ctx.lineTo(34, -30); ctx.lineTo(14, -30); ctx.fill();
    ctx.fillStyle = "rgba(12,12,12,0.5)"; ctx.fillRect(-90, 40, 70, 8);
    ctx.restore();
  }
  function gear(ctx, kind, x, y, s, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
    if (kind === "shoe") {
      const g = ctx.createLinearGradient(-130, -60, 130, 60); g.addColorStop(0, "#f3ffd1"); g.addColorStop(0.5, VOLT); g.addColorStop(1, "#6e8a00");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-130, 20); ctx.lineTo(-110, -60); ctx.lineTo(-40, -50); ctx.lineTo(10, -10); ctx.lineTo(110, 0); ctx.quadraticCurveTo(140, 10, 135, 35); ctx.lineTo(-130, 35); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f4f4f0"; ctx.fillRect(-132, 30, 270, 20);
    } else if (kind === "bottle") {
      const g = ctx.createLinearGradient(-50, 0, 50, 0); g.addColorStop(0, "#f4f4f0"); g.addColorStop(0.5, "#9b9a94"); g.addColorStop(1, "#4f4e4a");
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-46, -110, 92, 220, 30); ctx.fill();
      ctx.fillStyle = VOLT; ctx.fillRect(-46, -20, 92, 40); ctx.fillStyle = "#2a2a2a"; ctx.fillRect(-24, -140, 48, 34);
    } else {
      const g = ctx.createLinearGradient(-60, -100, 60, 100); g.addColorStop(0, "#f4f4f0"); g.addColorStop(1, "#8d8c86");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-40, -110); ctx.lineTo(30, -110); ctx.lineTo(30, 30); ctx.lineTo(90, 70); ctx.quadraticCurveTo(110, 110, 70, 115); ctx.lineTo(-40, 60); ctx.closePath(); ctx.fill();
      ctx.fillStyle = VOLT; ctx.fillRect(-40, -110, 70, 26);
    }
    ctx.restore();
  }
  function sceneEmbers(ctx, t, fontFamily) {
    const u = t - 18.5;
    studio(ctx, 1310, [206, 255, 0], 0.08);
    const px = lerp(W / 2, 300, easeInOut(u / 0.6)), ps = lerp(0.94, 0.5, easeInOut(u / 0.6)), py = lerp(800, 540, easeInOut(u / 0.6));
    phone(ctx, px, py, ps, -0.08, t, fontFamily, "still");
    const bx = 720, by = 1090;
    let bounce = 0, landed = 0;
    for (const gm of gems) {
      const q = clamp((u - 0.4 - gm.d) / 0.7, 0, 1);
      if (q >= 1) { landed++; bounce = Math.max(bounce, Math.exp(-(u - 0.4 - gm.d - 0.7) * 10)); continue; }
      if (q <= 0) continue;
      const x = lerp(px + 80, bx, q) + Math.sin(q * Math.PI) * gm.a * 220, y = lerp(py, by - 160, q) - Math.sin(q * Math.PI) * gm.h;
      gem(ctx, x, y, gm.s * 0.9, q * 6 + gm.a);
    }
    contactShadow(ctx, bx, by + 210, 260, 1);
    bag(ctx, bx, by, 0.95, bounce);
    // gear pops out once the embers land
    const pop = (d) => easeOutBack((u - 2.0 - d) / 0.4);
    gear(ctx, "shoe", bx - 230, by - 470 - pop(0) * 40, 0.9 * clamp(pop(0), 0, 1.2), clamp(pop(0), 0, 1));
    gear(ctx, "bottle", bx + 10, by - 560 - pop(0.12) * 30, 0.8 * clamp(pop(0.12), 0, 1.2), clamp(pop(0.12), 0, 1));
    gear(ctx, "sock", bx + 240, by - 450 - pop(0.24) * 30, 0.8 * clamp(pop(0.24), 0, 1.2), clamp(pop(0.24), 0, 1));
    // the embers counter
    ctx.save(); ctx.textAlign = "right"; ctx.font = `900 96px ${fontFamily}`; ctx.fillStyle = VOLT; ctx.shadowColor = VOLT; ctx.shadowBlur = 30;
    ctx.globalAlpha = smooth(0.4, 0.7, u); ctx.fillText(`+${Math.round((landed / gems.length) * 20)}`, W - 80, 300);
    ctx.shadowBlur = 0; ctx.font = `700 32px ${fontFamily}`; ctx.fillStyle = "rgba(244,244,240,0.6)"; ctx.fillText("EMBERS", W - 84, 350);
    ctx.restore();
  }

  // ---------- Scene F: the end card (21.5 to 24 s) ----------
  const endSparks = (() => { const r = rng(33); return Array.from({ length: 40 }, () => ({ a: -Math.PI / 2 + (r() - 0.5) * 2.2, v: 300 + r() * 700, r: 2 + r() * 5 })); })();
  function sceneEnd(ctx, t, fontFamily) {
    const u = t - 21.5;
    ctx.fillStyle = "#070707"; ctx.fillRect(0, 0, W, H);
    const halo = ctx.createRadialGradient(W / 2, 760, 0, W / 2, 760, 800);
    halo.addColorStop(0, `rgba(206,255,0,${0.16 * smooth(0.3, 0.8, u)})`); halo.addColorStop(1, "rgba(206,255,0,0)");
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
    const sc = 13, ox = W / 2 - 23 * sc, oy = 760 - 16 * sc;
    const lineP = easeOut(u / 0.35), bladeP = easeOutBack((u - 0.3) / 0.35);
    ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);
    ctx.fillStyle = "rgba(244,244,240,0.42)";
    ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(21.2 * lineP, 26); ctx.lineTo(21.2 * lineP - 1.7, 29.5); ctx.lineTo(0, 29.5); ctx.closePath(); ctx.fill();
    if (bladeP > 0) {
      const tx = lerp(22.8, 38.8, bladeP), ty = lerp(29.5, 1, bladeP);
      ctx.shadowColor = VOLT; ctx.shadowBlur = 3; ctx.fillStyle = VOLT;
      ctx.beginPath(); ctx.moveTo(22.8, 29.5); ctx.lineTo(30, 29.5); ctx.lineTo(tx + 7.2, ty); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    if (u > 0.55) {
      const tau = u - 0.55;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const s of endSparks) {
        const life = 0.9; if (tau > life) continue;
        const k = 1 - tau / life; ctx.globalAlpha = k; ctx.fillStyle = VOLT;
        ctx.beginPath(); ctx.arc(ox + 38 * sc + Math.cos(s.a) * s.v * tau, oy + 4 * sc + Math.sin(s.a) * s.v * tau + 500 * tau * tau, s.r * k, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.save(); ctx.textAlign = "center";
    const wk = easeOut((u - 0.6) / 0.5);
    ctx.globalAlpha = wk; ctx.fillStyle = INK; ctx.font = `900 118px ${fontFamily}`;
    try { ctx.fontStretch = "expanded"; ctx.letterSpacing = `${lerp(40, 8, wk)}px`; } catch { /* older browsers */ }
    ctx.fillText("LIMITLINE", W / 2 + 4, 1130);
    try { ctx.letterSpacing = "0px"; ctx.fontStretch = "normal"; } catch { /* older browsers */ }
    const tk = easeOut((u - 1.0) / 0.4);
    ctx.globalAlpha = tk; ctx.font = `800 64px ${fontFamily}`; ctx.fillStyle = VOLT; ctx.fillText("Cross your limit.", W / 2, 1250);
    const lk = easeOut((u - 1.3) / 0.4);
    ctx.globalAlpha = lk; ctx.font = `600 36px ${fontFamily}`; ctx.fillStyle = "rgba(244,244,240,0.65)"; ctx.fillText("Run · Ride · Swim · Hike  —  link in bio", W / 2, 1340);
    ctx.restore();
  }

  // ---------- Timeline ----------
  const SCENES = [
    { a: 0, b: 7.0, draw: sceneRun },
    { a: 7.0, b: 11.0, draw: sceneHeart },
    { a: 11.0, b: 14.5, draw: sceneMuscle },
    { a: 14.5, b: 18.5, draw: scenePhone },
    { a: 18.5, b: 21.5, draw: sceneEmbers },
    { a: 21.5, b: DUR, draw: sceneEnd },
  ];
  let grain = null;
  function render(ctx, t, fontFamily) {
    ctx.save();
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const i = SCENES.findIndex((s) => t >= s.a && t < s.b), sc = SCENES[i === -1 ? SCENES.length - 1 : i];
    sc.draw(ctx, t, fontFamily);
    // cut transitions: a quick volt-edged whip at each scene start
    const since = t - sc.a;
    if (sc.a > 0 && since < 0.22) {
      const k = 1 - since / 0.22;
      ctx.fillStyle = `rgba(0,0,0,${0.85 * k})`; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(206,255,0,${0.25 * k})`; ctx.fillRect(0, H * (1 - k) * 0.5, W, H * k * 0.04 + 2);
    }
    captions(ctx, t, fontFamily);
    // film grain (vector noise dots, deterministic per frame) and vignette
    if (!grain) { const r = rng(77); grain = Array.from({ length: 420 }, () => [r() * W, r() * H, r()]); }
    ctx.save(); ctx.globalAlpha = 0.05; ctx.fillStyle = "#fff";
    const shift = Math.floor(t * 30) * 37;
    for (const [x, y, k] of grain) ctx.fillRect((x + shift * k) % W, (y + shift) % H, 1.6, 1.6);
    ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H * 0.45, W * 0.35, W / 2, H * 0.45, H * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  window.LimitlineReel = { render, W, H, DUR, CAPTIONS, TC };
  window.Reel = { render, DUR, COVER: 6.1, CAPTIONS };
})();
