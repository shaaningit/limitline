// Shared helpers for the LIMITLINE reels. Every reel is a pure function of time:
// render(ctx, t) always draws the same picture for the same t, so a page can play it live
// and the exporter can render it frame by frame.
(function () {
  const W = 1080, H = 1920, TAU = Math.PI * 2;
  const VOLT = "#ceff00", INK = "#f4f4f0", BLACK = "#0b0b0b", BONE = "#ecebe4";
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeOutExpo = (t) => { t = clamp(t, 0, 1); return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  const easeOutBack = (t) => { t = clamp(t, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Font with optional width (Archivo has a width axis) and letter spacing.
  function font(ctx, weight, size, ff, stretch = "normal", spacing = 0) {
    ctx.font = `${weight} ${size}px ${ff}`;
    try { ctx.fontStretch = stretch; ctx.letterSpacing = `${spacing}px`; } catch { /* older browsers */ }
  }

  // Word-by-word captions. Words wrapped in *stars* are keywords.
  // style "stroke": white text with a black outline, keywords in volt (for dark scenes).
  // style "box": black text, keywords on a volt marker box (for light scenes).
  function captions(ctx, t, list, ff, o = {}) {
    const cap = list.find((c) => t >= c.a && t <= c.b);
    if (!cap) return;
    const size = o.size || 84, lh = size * 1.15, cy = o.y || H * 0.735, style = o.style || "stroke";
    const tokens = cap.words.split(" ").map((w) => ({ hot: w.startsWith("*") || w.endsWith("*"), w: w.replace(/\*/g, "") }));
    const per = Math.min(0.24, (cap.b - cap.a - 0.6) / tokens.length);
    ctx.save();
    font(ctx, 900, size, ff, o.stretch || "semi-expanded");
    ctx.textBaseline = "alphabetic";
    const maxW = o.maxW || 900, lines = [[]];
    let lw = 0;
    for (const tk of tokens) {
      const w = ctx.measureText(tk.w + " ").width;
      if (lw + w > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push({ ...tk, width: w }); lw += w;
    }
    const top = cy - (lines.length * lh) / 2;
    const out = smooth(cap.b - 0.18, cap.b, t);
    const space = ctx.measureText(" ").width;
    let i = 0;
    lines.forEach((line, li) => {
      const total = line.reduce((s, x) => s + x.width, 0) - space;
      let x = (W - total) / 2;
      for (const tk of line) {
        const t0 = cap.a + i * per, k = clamp((t - t0) / 0.16, 0, 1);
        i++;
        if (k <= 0) { x += tk.width; continue; }
        const s = easeOutBack(k) * (1 - out * 0.2);
        const wordW = tk.width - space, y = top + li * lh + lh * 0.8;
        ctx.save();
        ctx.translate(x + wordW / 2, y - size * 0.35);
        ctx.scale(s, s);
        ctx.globalAlpha = Math.min(1, k * 1.4) * (1 - out);
        ctx.lineJoin = "round";
        if (style === "box") {
          if (tk.hot) {
            ctx.fillStyle = VOLT;
            ctx.beginPath(); ctx.roundRect(-wordW / 2 - 14, -size * 0.62, wordW + 28, size * 1.02, 10); ctx.fill();
          }
          ctx.fillStyle = BLACK;
          ctx.fillText(tk.w, -wordW / 2, size * 0.35);
        } else {
          ctx.lineWidth = size * 0.19; ctx.strokeStyle = "rgba(0,0,0,0.85)";
          ctx.strokeText(tk.w, -wordW / 2, size * 0.35);
          ctx.shadowColor = tk.hot ? "rgba(206,255,0,0.55)" : "rgba(0,0,0,0.6)"; ctx.shadowBlur = tk.hot ? 26 : 10;
          ctx.fillStyle = tk.hot ? VOLT : INK;
          ctx.fillText(tk.w, -wordW / 2, size * 0.35);
        }
        ctx.restore();
        x += tk.width;
      }
    });
    ctx.restore();
  }

  // Film grain (deterministic dots) and a vignette, drawn last.
  let grainPts = null;
  function finish(ctx, t, o = {}) {
    if (!grainPts) { const r = rng(77); grainPts = Array.from({ length: 420 }, () => [r() * W, r() * H, r()]); }
    ctx.save(); ctx.globalAlpha = o.grain ?? 0.05; ctx.fillStyle = o.grainColor || "#fff";
    const shift = Math.floor(t * 30) * 37;
    for (const [x, y, k] of grainPts) ctx.fillRect((x + shift * k) % W, (y + shift) % H, 1.6, 1.6);
    ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H * 0.45, W * 0.35, W / 2, H * 0.45, H * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(0,0,0,${o.vignette ?? 0.55})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  // The break-out mark: a grey line and a volt blade breaking up out of it.
  // p0 draws the line in, p1 swings the blade up. Units: the mark is 46 x 32 at scale 1.
  function mark(ctx, ox, oy, sc, lineP, bladeP, lineColor = "rgba(244,244,240,0.42)") {
    ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);
    ctx.fillStyle = lineColor;
    ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(21.2 * lineP, 26); ctx.lineTo(21.2 * lineP - 1.7, 29.5); ctx.lineTo(0, 29.5); ctx.closePath(); ctx.fill();
    if (bladeP > 0) {
      const tx = lerp(22.8, 38.8, bladeP), ty = lerp(29.5, 1, bladeP);
      ctx.shadowColor = VOLT; ctx.shadowBlur = 3; ctx.fillStyle = VOLT;
      ctx.beginPath(); ctx.moveTo(22.8, 29.5); ctx.lineTo(30, 29.5); ctx.lineTo(tx + 7.2, ty); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // The promise every athlete-facing ad ends on.
  const PROMISE = ["Beat your limit.", "Get rewarded."];

  // Dark end card: the mark draws itself, then the wordmark, a tagline and a call to action.
  const endSparks = (() => { const r = rng(33); return Array.from({ length: 40 }, () => ({ a: -Math.PI / 2 + (r() - 0.5) * 2.2, v: 300 + r() * 700, r: 2 + r() * 5 })); })();
  function endCard(ctx, u, ff, o = {}) {
    ctx.fillStyle = "#070707"; ctx.fillRect(0, 0, W, H);
    const halo = ctx.createRadialGradient(W / 2, 760, 0, W / 2, 760, 800);
    halo.addColorStop(0, `rgba(206,255,0,${0.16 * smooth(0.3, 0.8, u)})`); halo.addColorStop(1, "rgba(206,255,0,0)");
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
    const sc = 13, ox = W / 2 - 23 * sc, oy = 760 - 16 * sc;
    mark(ctx, ox, oy, sc, easeOut(u / 0.35), easeOutBack((u - 0.3) / 0.35));
    if (u > 0.55) {
      const tau = u - 0.55;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const s of endSparks) {
        if (tau > 0.9) continue;
        const k = 1 - tau / 0.9; ctx.globalAlpha = k; ctx.fillStyle = VOLT;
        ctx.beginPath(); ctx.arc(ox + 38 * sc + Math.cos(s.a) * s.v * tau, oy + 4 * sc + Math.sin(s.a) * s.v * tau + 500 * tau * tau, s.r * k, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.save(); ctx.textAlign = "center";
    const wk = easeOut((u - 0.6) / 0.5);
    ctx.globalAlpha = wk; ctx.fillStyle = INK;
    font(ctx, 900, 118, ff, "expanded", lerp(40, 8, wk));
    ctx.fillText("LIMITLINE", W / 2 + 4, 1130);
    // The tagline: one line in volt, or the two-line promise (white, then volt).
    const tag = o.tagline || PROMISE;
    font(ctx, 800, 64, ff);
    let subY = 1340;
    if (Array.isArray(tag)) {
      ctx.globalAlpha = easeOut((u - 1.0) / 0.4); ctx.fillStyle = INK; ctx.fillText(tag[0], W / 2, 1245);
      ctx.globalAlpha = easeOut((u - 1.25) / 0.4); ctx.fillStyle = VOLT; ctx.shadowColor = "rgba(206,255,0,0.5)"; ctx.shadowBlur = 24;
      ctx.fillText(tag[1], W / 2, 1325); ctx.shadowBlur = 0;
      subY = 1420;
    } else {
      ctx.globalAlpha = easeOut((u - 1.0) / 0.4); ctx.fillStyle = VOLT; ctx.fillText(tag, W / 2, 1250);
    }
    font(ctx, 600, 36, ff);
    ctx.globalAlpha = easeOut((u - 1.45) / 0.4); ctx.fillStyle = "rgba(244,244,240,0.65)";
    ctx.fillText(o.sub || "Run · Ride · Swim · Hike  —  link in bio", W / 2, subY);
    ctx.restore();
  }

  window.LL = { W, H, TAU, VOLT, INK, BLACK, BONE, lerp, clamp, smooth, easeOut, easeOutExpo, easeOutBack, easeInOut, rng, font, captions, finish, mark, endCard, PROMISE };
})();
