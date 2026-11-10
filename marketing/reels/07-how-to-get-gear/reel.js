// Reel 7, "How to get gear for working out" (15 s). A loud tutorial: volt background, black type,
// chunky "toy" 3D objects made by extruding flat shapes (stacked offset layers with a black edge).
// Three steps: pick a quest, beat your limit, get rewarded.
(function () {
  const { W, H, TAU, VOLT, BLACK, lerp, clamp, smooth, easeOut, easeOutExpo, easeOutBack, easeInOut, rng, font, finish, endCard } = window.LL;
  const DUR = 15;
  const FF = "Archivo, Inter, sans-serif";
  const STEPS = [
    { a: 2.4, b: 5.7, n: "1", title: "PICK A QUEST", sub: "Run, ride, swim or hike." },
    { a: 5.7, b: 9.0, n: "2", title: "BEAT YOUR LIMIT", sub: "Beat your own best. Checked with Strava." },
    { a: 9.0, b: 12.4, n: "3", title: "GET REWARDED", sub: "Embers buy real gear in the shop." },
  ];

  // Extrude a flat shape: dark layers stacked down-right, then the face with a black outline.
  function extrude(ctx, path, face, depth = 18, side = "#0b0b0b") {
    for (let i = depth; i >= 1; i -= 2) { ctx.save(); ctx.translate(i * 0.6, i); path(ctx); ctx.fillStyle = side; ctx.fill(); ctx.restore(); }
    path(ctx); ctx.fillStyle = face; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = BLACK; ctx.stroke();
  }
  const rr = (x, y, w, h, r) => (c) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

  function bg(ctx, t) {
    ctx.fillStyle = VOLT; ctx.fillRect(0, 0, W, H);
    // a halftone dot field drifting slowly
    ctx.fillStyle = "rgba(11,11,11,0.07)";
    const off = (t * 20) % 60;
    for (let y = -60; y < H + 60; y += 60) for (let x = -60; x < W + 60; x += 60) {
      ctx.beginPath(); ctx.arc(x + off + ((y / 60) % 2) * 30, y + off, 5, 0, TAU); ctx.fill();
    }
  }
  function slam(ctx, text, x, y, size, k, color = BLACK, align = "left", stretch = "extra-condensed", maxW = 920) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y);
    const s = lerp(1.5, 1, easeOutExpo(k)); ctx.scale(s, s); ctx.globalAlpha = clamp(k * 2, 0, 1);
    font(ctx, 900, size, FF, stretch, 0);
    const w = ctx.measureText(text).width;
    if (w > maxW) font(ctx, 900, size * maxW / w, FF, stretch, 0);
    ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // ---------- Hook ----------
  function hook(ctx, t) {
    slam(ctx, "HOW TO GET", 90, 560, 210, (t - 0.1) / 0.25);
    slam(ctx, "GEAR FOR", 90, 760, 210, (t - 0.45) / 0.25);
    slam(ctx, "WORKING OUT", 90, 960, 210, (t - 0.8) / 0.25);
    const k = easeOutBack((t - 1.2) / 0.35);
    if (k > 0) {
      ctx.save(); ctx.translate(740, 1260); ctx.rotate(-0.14 + (1 - clamp(k, 0, 1)) * 0.6); ctx.scale(clamp(k, 0, 1.15), clamp(k, 0, 1.15));
      extrude(ctx, rr(-180, -80, 360, 160, 80), BLACK, 16, "#2a2a2a");
      font(ctx, 900, 64, FF, "normal", 2); ctx.fillStyle = VOLT; ctx.textAlign = "center"; ctx.fillText("3 STEPS", 0, 22);
      ctx.restore();
    }
    // a bouncing shoe
    const b = Math.abs(Math.sin(t * 5)) * 60;
    ctx.save(); ctx.translate(300, 1300 - b); ctx.rotate(-0.1);
    shoe(ctx, 0, 0, 1.2 * clamp(easeOutBack((t - 1.0) / 0.35), 0, 1.1));
    ctx.restore();
  }

  // ---------- Objects ----------
  function shoe(ctx, x, y, s) {
    if (s <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const p = (c) => { c.beginPath(); c.moveTo(-130, 20); c.lineTo(-110, -60); c.lineTo(-40, -50); c.lineTo(10, -10); c.lineTo(110, 0); c.quadraticCurveTo(140, 10, 135, 35); c.lineTo(-130, 35); c.closePath(); };
    extrude(ctx, p, "#f4f4f0", 14);
    ctx.fillStyle = BLACK; ctx.fillRect(-132, 30, 270, 16);
    ctx.strokeStyle = BLACK; ctx.lineWidth = 6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-40 + i * 22, -40 + i * 10); ctx.lineTo(-20 + i * 22, -26 + i * 10); ctx.stroke(); }
    ctx.restore();
  }
  function socks(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const p = (c) => { c.beginPath(); c.moveTo(-36, -110); c.lineTo(30, -110); c.lineTo(30, 20); c.quadraticCurveTo(32, 50, 70, 64); c.quadraticCurveTo(102, 80, 84, 108); c.lineTo(-10, 98); c.quadraticCurveTo(-40, 90, -38, 40); c.closePath(); };
    extrude(ctx, p, "#f4f4f0", 12);
    ctx.fillStyle = BLACK; ctx.fillRect(-36, -110, 66, 22);
    ctx.restore();
  }
  function bottle(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    extrude(ctx, rr(-50, -100, 100, 210, 30), "#f4f4f0", 12);
    ctx.fillStyle = BLACK; ctx.fillRect(-50, -10, 100, 36);
    extrude(ctx, rr(-26, -136, 52, 40, 10), BLACK, 6, "#2a2a2a");
    ctx.restore();
  }
  function gem(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const p = (c) => { c.beginPath(); c.moveTo(0, -38); c.lineTo(32, -6); c.lineTo(0, 44); c.lineTo(-32, -6); c.closePath(); };
    extrude(ctx, p, "#f4f4f0", 8);
    ctx.fillStyle = BLACK; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(10, -6); ctx.lineTo(0, 44); ctx.lineTo(-10, -6); ctx.closePath(); ctx.globalAlpha = 0.15; ctx.fill();
    ctx.restore();
  }

  // ---------- Step scenes ----------
  const QUESTS = [["Run 10 km", -0.16], ["Climb 1000 m", 0.08], ["Ride 40 km", -0.05], ["Swim 1.5 km", 0.14]];
  function step1(ctx, t) {
    const u = t - 2.4;
    QUESTS.forEach(([q, rot], i) => {
      const k = easeOutBack((u - 0.35 - i * 0.18) / 0.45);
      if (k <= 0) return;
      const y = 820 + i * 175, x = W / 2 + (i % 2 ? 60 : -60);
      const picked = i === 0 && u > 1.9;
      ctx.save(); ctx.translate(x + (1 - clamp(k, 0, 1)) * (i % 2 ? 600 : -600), y); ctx.rotate(rot * (picked ? 0.3 : 1));
      const s = picked ? 1 + 0.08 * easeOutBack((u - 1.9) / 0.3) : 1; ctx.scale(s, s);
      extrude(ctx, rr(-330, -70, 660, 140, 28), picked ? BLACK : "#f4f4f0", 18);
      font(ctx, 900, 64, FF, "condensed"); ctx.fillStyle = picked ? VOLT : BLACK; ctx.fillText(q, -280, 22);
      if (picked) {
        ctx.fillStyle = VOLT; ctx.beginPath(); ctx.arc(250, 0, 36, 0, TAU); ctx.fill();
        ctx.strokeStyle = BLACK; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(234, 0); ctx.lineTo(246, 14); ctx.lineTo(268, -12); ctx.stroke();
      }
      ctx.restore();
    });
  }
  function step2(ctx, t) {
    const u = t - 5.7;
    // the track bar with a dashed "your limit" marker
    const k = easeOutExpo((u - 0.2) / 0.5);
    ctx.save(); ctx.globalAlpha = clamp(k, 0, 1); ctx.translate(0, (1 - k) * 120);
    const x0 = 120, y0 = 1000, w = 840, lim = 0.72;
    extrude(ctx, rr(x0, y0, w, 120, 60), "#f4f4f0", 20);
    const fill = easeInOut((u - 0.6) / 1.6) * 0.86;
    if (fill > 0.02) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(x0 + 10, y0 + 10, w - 20, 100, 50); ctx.clip();
      ctx.fillStyle = BLACK; ctx.fillRect(x0 + 10, y0 + 10, (w - 20) * fill, 100);
      ctx.restore();
    }
    const lx = x0 + 10 + (w - 20) * lim;
    const broke = fill > lim;
    ctx.save(); ctx.setLineDash([16, 12]); ctx.strokeStyle = broke ? VOLT : BLACK; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(lx, y0 - 70); ctx.lineTo(lx, y0 + 190); ctx.stroke(); ctx.restore();
    font(ctx, 800, 34, FF, "normal", 3); ctx.fillStyle = BLACK; ctx.textAlign = "center"; ctx.fillText("YOUR LIMIT", lx, y0 - 90);
    ctx.restore();
    // the break: shards and a sticker
    if (broke) {
      const bu = u - (0.6 + 1.6 * 0.47);
      const r = rng(5);
      for (let i = 0; i < 18; i++) {
        const a = -Math.PI / 2 + (r() - 0.5) * 2.4, v = 300 + r() * 600, s = 10 + r() * 20;
        const px = lx + Math.cos(a) * v * bu, py = y0 + 60 + Math.sin(a) * v * bu + 900 * bu * bu;
        ctx.save(); ctx.globalAlpha = clamp(1 - bu, 0, 1); ctx.translate(px, py); ctx.rotate(r() * TAU + bu * 6);
        ctx.fillStyle = BLACK; ctx.fillRect(-s / 2, -s / 2, s, s * 0.6); ctx.restore();
      }
      const sk = easeOutBack((bu - 0.15) / 0.35);
      if (sk > 0) {
        ctx.save(); ctx.translate(730, 700); ctx.rotate(-0.1); ctx.scale(clamp(sk, 0, 1.2), clamp(sk, 0, 1.2));
        extrude(ctx, rr(-210, -90, 420, 180, 40), BLACK, 16, "#2a2a2a");
        font(ctx, 900, 100, FF, "semi-expanded"); ctx.fillStyle = VOLT; ctx.textAlign = "center"; ctx.fillText("+4.1%", 0, 36);
        ctx.restore();
      }
    }
  }
  function step3(ctx, t) {
    const u = t - 9.0;
    const bx = W / 2, by = 1150;
    const k = easeOutBack((u - 0.15) / 0.45);
    if (k <= 0) return;
    const open = easeOutBack((u - 0.9) / 0.4);
    // the box
    ctx.save(); ctx.translate(bx, by); ctx.scale(clamp(k, 0, 1.1), clamp(k, 0, 1.1));
    extrude(ctx, rr(-220, -40, 440, 300, 24), "#f4f4f0", 24);
    ctx.fillStyle = BLACK; ctx.fillRect(-30, -40, 60, 300);
    ctx.save(); ctx.translate(open * 330, -60 - open * 90); ctx.rotate(open * 0.55);
    extrude(ctx, rr(-250, -50, 500, 90, 20), "#f4f4f0", 16);
    ctx.fillStyle = BLACK; ctx.fillRect(-30, -50, 60, 90);
    ctx.restore();
    ctx.restore();
    // items fly out of the box
    const items = [
      { d: socks, x: -260, y: -420, s: 1.0, at: 1.0 },
      { d: bottle, x: 0, y: -520, s: 0.9, at: 1.12 },
      { d: shoe, x: 270, y: -400, s: 0.85, at: 1.24 },
    ];
    for (const it of items) {
      const q = easeOutBack((u - it.at) / 0.45);
      if (q <= 0) continue;
      ctx.save(); ctx.translate(bx + it.x * clamp(q, 0, 1.1), by - 60 + it.y * clamp(q, 0, 1.1) + Math.sin(u * 3 + it.x) * 10);
      it.d(ctx, 0, 0, it.s * clamp(q, 0, 1.1)); ctx.restore();
    }
    // gems
    for (let i = 0; i < 8; i++) {
      const q = clamp((u - 1.0 - i * 0.05) / 0.9, 0, 1);
      if (q <= 0 || q >= 1) continue;
      const a = -Math.PI / 2 + (i - 3.5) * 0.28;
      gem(ctx, bx + Math.cos(a) * 520 * q, by - 80 + Math.sin(a) * 520 * q + 500 * q * q, 0.8, q * 5 + i);
    }
  }
  function stepFrame(ctx, t, s) {
    const u = t - s.a;
    // the big numeral and the title
    const nk = easeOutBack(u / 0.35);
    if (nk > 0) {
      ctx.save(); ctx.translate(140, 400); ctx.scale(clamp(nk, 0, 1.15), clamp(nk, 0, 1.15));
      extrude(ctx, (c) => { c.beginPath(); c.arc(0, 0, 90, 0, TAU); }, BLACK, 14, "#2a2a2a");
      font(ctx, 900, 120, FF, "condensed"); ctx.fillStyle = VOLT; ctx.textAlign = "center"; ctx.fillText(s.n, 0, 42);
      ctx.restore();
    }
    slam(ctx, s.title, 260, 445, 150, (u - 0.12) / 0.25, BLACK, "left", "extra-condensed", 740);
    const sk = easeOut((u - 0.6) / 0.4);
    if (sk > 0) {
      ctx.save(); ctx.globalAlpha = sk; font(ctx, 800, 44, FF); ctx.fillStyle = BLACK; ctx.textAlign = "center";
      ctx.fillText(s.sub, W / 2, 1560); ctx.restore();
    }
  }

  function render(ctx, t, ff) {
    ctx.save();
    if (t < 12.4) {
      bg(ctx, t);
      if (t < 2.4) hook(ctx, t);
      else {
        const s = STEPS.find((v) => t >= v.a && t < v.b);
        if (s.n === "1") step1(ctx, t); else if (s.n === "2") step2(ctx, t); else step3(ctx, t);
        stepFrame(ctx, t, s);
      }
      // a black wipe between steps
      for (const c of [2.4, 5.7, 9.0]) {
        const k = (t - c + 0.18) / 0.36;
        if (k > 0 && k < 1) {
          ctx.fillStyle = BLACK;
          const x = lerp(-W * 1.2, W * 1.2, easeInOut(k));
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W, 0); ctx.lineTo(x + W - 300, H); ctx.lineTo(x - 300, H); ctx.fill();
        }
      }
      const out = smooth(12.15, 12.4, t);
      if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
      finish(ctx, t, { grain: 0.06, grainColor: "#000", vignette: 0.12 });
    } else {
      endCard(ctx, t - 12.4, ff);
      finish(ctx, t);
    }
    ctx.restore();
  }
  window.Reel = { render, DUR, COVER: 1.6 };
})();
