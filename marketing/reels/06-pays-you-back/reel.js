// Reel 6, "Workouts that pay you back" (16 s). Looks like a real user's screen recording:
// the app fills the frame, with TikTok-style white caption boxes and touch circles.
// Three workouts sync, each beats its limit and shoots +20 embers into the balance, then the
// shop: socks for 50 embers, Redeem, confetti. Prices are the app's sample shop prices and
// the ember amounts follow the app's rule (beat your limit = double), so it says
// "Illustrative example".
(function () {
  const { W, H, TAU, VOLT, INK, lerp, clamp, smooth, easeOut, easeOutExpo, easeOutBack, easeInOut, rng, font, finish, endCard } = window.LL;
  const DUR = 16;
  const FF = "Archivo, Inter, sans-serif";
  const ACTS = [
    { at: 0.8, sport: "run", title: "Run 10 km", sub: "47:12", pct: "+4.1%", note: "Morning Run · 10.0 km" },
    { at: 3.0, sport: "ride", title: "Ride 40 km", sub: "1:21:40", pct: "+2.6%", note: "Lunch Ride · 40.3 km" },
    { at: 5.2, sport: "swim", title: "Swim 1.5 km", sub: "31:05", pct: "+3.3%", note: "Pool Swim · 1,500 m" },
  ];
  const START = 30;
  const OVERLAYS = [
    { a: 0.15, b: 2.8, text: "POV: your workouts start paying you back" },
    { a: 3.0, b: 5.1, text: "beat your limit = double embers" },
    { a: 5.25, b: 7.5, text: "run, ride, swim, hike. it all counts" },
    { a: 8.5, b: 10.4, text: "3 workouts later..." },
    { a: 10.7, b: 13.0, text: "real gear. earned, not bought." },
  ];

  // ---------- small UI pieces ----------
  function gemIcon(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = "#b6e600"; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(13, -3); ctx.lineTo(0, 18); ctx.lineTo(-13, -3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f2ffc2"; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(-13, -3); ctx.lineTo(-3, -3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#7a9900"; ctx.beginPath(); ctx.moveTo(4, -3); ctx.lineTo(13, -3); ctx.lineTo(0, 18); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function sportIcon(ctx, kind, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(206,255,0,0.12)"; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill();
    ctx.strokeStyle = VOLT; ctx.fillStyle = VOLT; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (kind === "run") {
      ctx.beginPath(); ctx.arc(6, -20, 6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-4, 8); ctx.lineTo(-16, 20); ctx.moveTo(-4, 8); ctx.lineTo(10, 20); ctx.moveTo(-1, -6); ctx.lineTo(-16, 0); ctx.moveTo(-1, -6); ctx.lineTo(14, -2); ctx.stroke();
    } else if (kind === "ride") {
      ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-15, 10, 11, 0, TAU); ctx.arc(15, 10, 11, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, 10); ctx.lineTo(-3, -8); ctx.lineTo(12, -8); ctx.lineTo(15, 10); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(14, -6, 6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-22, 2); ctx.lineTo(6, -2); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-24, 16); ctx.quadraticCurveTo(-12, 8, 0, 16); ctx.quadraticCurveTo(12, 24, 24, 16); ctx.stroke();
    }
    ctx.restore();
  }
  function statusBar(ctx) {
    font(ctx, 700, 34, FF); ctx.fillStyle = INK; ctx.fillText("7:42", 70, 76);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(W - 140, 52, 64, 30, 8); ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(W - 135, 57, 44, 20); ctx.fillRect(W - 74, 61, 5, 12);
    for (let i = 0; i < 4; i++) ctx.fillRect(W - 250 + i * 14, 76 - i * 7, 9, 6 + i * 7);
  }
  function header(ctx, balance, pulse) {
    window.LL.mark(ctx, 70, 150, 2.1, 1, 1);
    font(ctx, 800, 34, FF, "expanded", 3); ctx.fillStyle = INK; ctx.fillText("LIMITLINE", 180, 210);
    // balance pill
    const s = 1 + pulse * 0.18;
    ctx.save(); ctx.translate(W - 175, 196); ctx.scale(s, s);
    ctx.fillStyle = pulse > 0.05 ? "rgba(206,255,0,0.25)" : "rgba(255,255,255,0.08)";
    ctx.beginPath(); ctx.roundRect(-110, -38, 220, 76, 38); ctx.fill();
    gemIcon(ctx, -62, 0, 1.3);
    font(ctx, 900, 40, FF); ctx.fillStyle = INK; ctx.fillText(String(balance), -30, 14);
    ctx.restore();
  }
  function nav(ctx, active, tapK) {
    ctx.fillStyle = "rgba(16,17,19,0.96)"; ctx.fillRect(0, 1740, W, 180);
    ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(0, 1740, W, 2);
    const xs = [135, 405, 675, 945];
    xs.forEach((x, i) => {
      const on = i === active;
      ctx.strokeStyle = on ? VOLT : "rgba(244,244,240,0.45)"; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 6; ctx.lineJoin = "round";
      ctx.beginPath();
      if (i === 0) { ctx.moveTo(x - 24, 1830); ctx.lineTo(x, 1800); ctx.lineTo(x + 24, 1830); ctx.lineTo(x, 1860); ctx.closePath(); ctx.stroke(); }
      else if (i === 1) { ctx.fillRect(x - 26, 1830, 14, 30); ctx.fillRect(x - 7, 1810, 14, 50); ctx.fillRect(x + 12, 1822, 14, 38); }
      else if (i === 2) { ctx.roundRect(x - 26, 1812, 52, 46, 8); ctx.stroke(); ctx.beginPath(); ctx.arc(x, 1812, 14, Math.PI, 0); ctx.stroke(); }
      else { ctx.arc(x, 1818, 14, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x, 1866, 28, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    });
    if (tapK > 0) touch(ctx, xs[2], 1835, tapK);
  }
  // iOS-style touch indicator
  function touch(ctx, x, y, k) {
    if (k <= 0 || k >= 1) return;
    ctx.save(); ctx.globalAlpha = Math.sin(clamp(k, 0, 1) * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 46 - 10 * k, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function overlay(ctx, t) {
    const o = OVERLAYS.find((v) => t >= v.a && t <= v.b);
    if (!o) return;
    const k = easeOutBack((t - o.a) / 0.25) * (1 - smooth(o.b - 0.12, o.b, t));
    font(ctx, 800, 52, FF);
    // wrap to two lines max
    const words = o.text.split(" "), lines = [""];
    for (const w of words) { const tryL = (lines[lines.length - 1] + " " + w).trim(); if (ctx.measureText(tryL).width > 820 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tryL; }
    ctx.save(); ctx.translate(W / 2, t < 8.3 ? 1420 : 545); ctx.scale(clamp(k, 0, 1.1), clamp(k, 0, 1.1)); ctx.globalAlpha = clamp(k, 0, 1);
    const lh = 70, top = -(lines.length * lh) / 2;
    lines.forEach((ln, i) => {
      const w = ctx.measureText(ln).width + 50;
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(-w / 2, top + i * lh - 4, w, lh + 8, 16); ctx.fill();
    });
    ctx.fillStyle = "#0b0b0b"; ctx.textAlign = "center";
    lines.forEach((ln, i) => ctx.fillText(ln, 0, top + i * lh + 52));
    ctx.restore();
  }

  // ---------- Screen A: workouts sync and pay out ----------
  function balanceAt(t) {
    let b = START;
    for (const a of ACTS) if (t > a.at + 1.75) b += 20;
    if (t > 11.0) b -= 50;
    return b;
  }
  function pulseAt(t) {
    let p = 0;
    for (const a of ACTS) { const u = t - a.at - 1.75; if (u > 0 && u < 0.4) p = Math.max(p, 1 - u / 0.4); }
    return p;
  }
  function resultCard(ctx, a, y, t) {
    const u = t - a.at - 0.55, k = easeOutExpo(u / 0.5);
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(k, 0, 1); ctx.translate(0, (1 - k) * -60);
    ctx.fillStyle = "#151515"; ctx.strokeStyle = u < 1.4 ? `rgba(206,255,0,${0.6 * (1 - u / 1.4)})` : "rgba(255,255,255,0.08)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(70, y, W - 140, 290, 34); ctx.fill(); ctx.stroke();
    sportIcon(ctx, a.sport, 150, y + 90);
    font(ctx, 800, 44, FF); ctx.fillStyle = INK; ctx.fillText(a.title, 220, y + 84);
    font(ctx, 600, 26, FF); ctx.fillStyle = "rgba(244,244,240,0.55)"; ctx.fillText(`${a.sub} · synced from Strava`, 220, y + 124);
    // checked tick
    const ck = easeOutBack((u - 0.25) / 0.3);
    if (ck > 0) {
      ctx.save(); ctx.translate(W - 140, y + 74); ctx.scale(clamp(ck, 0, 1.2), clamp(ck, 0, 1.2));
      ctx.fillStyle = VOLT; ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#0b0b0b"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-2, 8); ctx.lineTo(11, -8); ctx.stroke();
      ctx.restore();
    }
    const pk = easeOut((u - 0.35) / 0.5);
    font(ctx, 900, 92, FF, "semi-expanded"); ctx.fillStyle = VOLT; ctx.shadowColor = "rgba(206,255,0,0.45)"; ctx.shadowBlur = 20;
    const target = parseFloat(a.pct.slice(1));
    ctx.fillText(`+${(target * pk).toFixed(1)}%`, 112, y + 236); ctx.shadowBlur = 0;
    font(ctx, 600, 28, FF); ctx.fillStyle = INK; ctx.fillText("beyond your limit", 470, y + 232);
    // the +20 chip (it flies away to the balance)
    const fly = clamp((t - a.at - 1.25) / 0.5, 0, 1);
    if (fly < 1) {
      const sx = W - 260, sy = y + 200, ex = W - 175, ey = 196 - (1 - k) * -60;
      const x = lerp(sx, ex, easeInOut(fly)), yy = lerp(sy, ey, easeInOut(fly)) - Math.sin(fly * Math.PI) * 160;
      const s = lerp(1, 0.6, fly);
      ctx.save(); ctx.translate(x, yy); ctx.scale(s, s);
      ctx.fillStyle = VOLT; ctx.beginPath(); ctx.roundRect(-90, -34, 180, 68, 34); ctx.fill();
      gemIcon(ctx, -50, 0, 1.1); font(ctx, 900, 36, FF); ctx.fillStyle = "#0b0b0b"; ctx.fillText("+20", -24, 13);
      ctx.restore();
    }
    ctx.restore();
  }
  function banner(ctx, a, t) {
    const u = t - a.at, k = easeOutExpo(u / 0.35) * (1 - easeInOut((u - 1.1) / 0.3));
    if (k <= 0.001) return;
    ctx.save(); ctx.translate(0, (k - 1) * 260);
    ctx.fillStyle = "rgba(44,46,52,0.97)"; ctx.beginPath(); ctx.roundRect(40, 40, W - 80, 160, 38); ctx.fill();
    ctx.fillStyle = "#5c5e66"; ctx.beginPath(); ctx.roundRect(80, 78, 84, 84, 20); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(98, 140); ctx.lineTo(118, 104); ctx.lineTo(132, 128); ctx.lineTo(146, 100); ctx.stroke();
    font(ctx, 800, 32, FF); ctx.fillStyle = INK; ctx.fillText("New activity synced", 190, 112);
    font(ctx, 600, 28, FF); ctx.fillStyle = "rgba(244,244,240,0.7)"; ctx.fillText(a.note, 190, 156);
    ctx.restore();
  }
  function screenQuests(ctx, t) {
    ctx.fillStyle = "#0b0b0b"; ctx.fillRect(0, 0, W, H);
    header(ctx, balanceAt(t), pulseAt(t));
    font(ctx, 900, 64, FF, "semi-condensed"); ctx.fillStyle = INK; ctx.fillText("My quests", 70, 340);
    // newest on top: each new card pushes the older ones down
    const shown = ACTS.filter((a) => t > a.at + 0.55);
    shown.forEach((a, i) => {
      const newer = shown.length - 1 - i;
      let y = 390;
      for (let j = 0; j < newer; j++) y += 320 * easeInOut((t - shown[i + 1 + j].at - 0.45) / 0.35);
      resultCard(ctx, a, y, t);
    });
    nav(ctx, 0, (t - 7.75) / 0.35);
    statusBar(ctx);
    for (const a of ACTS) banner(ctx, a, t);
  }

  // ---------- Screen B: the shop ----------
  function socks(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (const [dx, rot, sh] of [[-34, -0.12, 0.85], [34, 0.1, 1]]) {
      ctx.save(); ctx.translate(dx, 0); ctx.rotate(rot);
      const g = ctx.createLinearGradient(-40, -100, 60, 100); g.addColorStop(0, "#f4f4f0"); g.addColorStop(1, `rgb(${Math.round(140 * sh)},${Math.round(139 * sh)},${Math.round(132 * sh)})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-36, -110); ctx.lineTo(30, -110); ctx.lineTo(30, 20); ctx.quadraticCurveTo(32, 50, 70, 64); ctx.quadraticCurveTo(102, 80, 84, 108); ctx.lineTo(-10, 98); ctx.quadraticCurveTo(-40, 90, -38, 40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = VOLT; ctx.fillRect(-36, -110, 66, 24);
      ctx.fillStyle = "#1f3a2c"; ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(-2, -58); ctx.lineTo(8, -46); ctx.lineTo(14, -52); ctx.lineTo(22, -40); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  function bottle(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, "#e9edf2"); g.addColorStop(0.45, "#a3aab5"); g.addColorStop(1, "#454a52");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-50, -100, 100, 210, 30); ctx.fill();
    ctx.fillStyle = "#2a5bd7"; ctx.fillRect(-50, -10, 100, 40); ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.roundRect(-26, -136, 52, 40, 10); ctx.fill();
    ctx.restore();
  }
  function cap(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-80, -60, 80, 40); g.addColorStop(0, "#6a6d76"); g.addColorStop(1, "#2a2c31");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 10, 80, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#1c1d21"; ctx.beginPath(); ctx.ellipse(70, 12, 70, 16, 0.05, 0, TAU); ctx.fill();
    window.LL.mark(ctx, -26, -46, 1.5, 1, 1);
    ctx.restore();
  }
  function shoe(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-130, -60, 130, 60); g.addColorStop(0, "#f3ffd1"); g.addColorStop(0.5, VOLT); g.addColorStop(1, "#6e8a00");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-130, 20); ctx.lineTo(-110, -60); ctx.lineTo(-40, -50); ctx.lineTo(10, -10); ctx.lineTo(110, 0); ctx.quadraticCurveTo(140, 10, 135, 35); ctx.lineTo(-130, 35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f4f4f0"; ctx.fillRect(-132, 30, 270, 20);
    ctx.restore();
  }
  const ITEMS = [
    { name: "MOXA trail socks", price: 50, draw: socks, x: 0, y: 0, s: 0.95 },
    { name: "HALDO electrolytes", price: 80, draw: bottle, x: 0, y: 0, s: 0.95 },
    { name: "LIMITLINE cap", price: 120, draw: cap, x: 0, y: 10, s: 1 },
    { name: "Trail shoes", price: 600, draw: shoe, x: 0, y: 10, s: 0.95 },
  ];
  const confetti = (() => { const r = rng(61); return Array.from({ length: 70 }, () => ({ a: -Math.PI / 2 + (r() - 0.5) * 2.4, v: 600 + r() * 900, rot: r() * TAU, vr: (r() - 0.5) * 14, c: [VOLT, "#f4f4f0", "#2a5bd7", "#1f3a2c"][Math.floor(r() * 4)], w: 12 + r() * 14 })); })();
  function screenShop(ctx, t) {
    ctx.fillStyle = "#0b0b0b"; ctx.fillRect(0, 0, W, H);
    header(ctx, balanceAt(t), t > 11.0 && t < 11.4 ? 1 - (t - 11.0) / 0.4 : 0);
    font(ctx, 900, 64, FF, "semi-condensed"); ctx.fillStyle = INK; ctx.fillText("Shop", 70, 340);
    font(ctx, 600, 28, FF); ctx.fillStyle = "rgba(244,244,240,0.55)"; ctx.fillText("Spend embers on real gear", 72, 386);
    ITEMS.forEach((it, i) => {
      const k = easeOutExpo((t - 8.45 - i * 0.07) / 0.45);
      const col = i % 2, row = Math.floor(i / 2), x = 70 + col * 480, y = 610 + row * 560;
      const can = it.price <= balanceAt(t);
      ctx.save(); ctx.globalAlpha = clamp(k, 0, 1); ctx.translate(0, (1 - k) * 80);
      ctx.fillStyle = "#151515"; ctx.beginPath(); ctx.roundRect(x, y, 460, 530, 34); ctx.fill();
      ctx.save(); ctx.globalAlpha *= can ? 1 : 0.4; it.draw(ctx, x + 230 + it.x, y + 220 + it.y, it.s); ctx.restore();
      font(ctx, 800, 32, FF); ctx.fillStyle = INK; ctx.fillText(it.name, x + 30, y + 430);
      gemIcon(ctx, x + 46, y + 478, 1.1); font(ctx, 900, 36, FF); ctx.fillStyle = can ? VOLT : "rgba(244,244,240,0.4)"; ctx.fillText(String(it.price), x + 72, y + 491);
      ctx.restore();
    });
    // tap the socks
    touch(ctx, 300, 820, (t - 9.3) / 0.35);
    // the product sheet
    const sk = easeOutExpo((t - 9.55) / 0.5);
    if (sk > 0) {
      ctx.fillStyle = `rgba(0,0,0,${0.55 * sk})`; ctx.fillRect(0, 0, W, H);
      const top = lerp(H, 660, sk);
      ctx.fillStyle = "#1a1b1e"; ctx.beginPath(); ctx.roundRect(0, top, W, H - top + 60, [48, 48, 0, 0]); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.beginPath(); ctx.roundRect(W / 2 - 40, top + 22, 80, 10, 5); ctx.fill();
      socks(ctx, W / 2, top + 280, 1.7);
      font(ctx, 900, 56, FF); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.fillText("MOXA trail socks", W / 2, top + 560);
      font(ctx, 600, 30, FF); ctx.fillStyle = "rgba(244,244,240,0.6)"; ctx.fillText("Sample sponsor · ships to you", W / 2, top + 608);
      const done = t > 11.0;
      const bk = done ? easeOutBack((t - 11.0) / 0.3) : 1;
      ctx.save(); ctx.translate(W / 2, top + 740); ctx.scale(clamp(bk, 0.9, 1.08), clamp(bk, 0.9, 1.08));
      ctx.fillStyle = done ? VOLT : INK; ctx.beginPath(); ctx.roundRect(-400, -60, 800, 120, 60); ctx.fill();
      font(ctx, 900, 42, FF); ctx.fillStyle = "#0b0b0b";
      ctx.fillText(done ? "Redeemed ✓" : "Redeem for 50 embers", 0, 15);
      ctx.restore(); ctx.textAlign = "left";
      touch(ctx, W / 2 + 120, top + 740, (t - 10.75) / 0.35);
      if (done) {
        const u = t - 11.0;
        ctx.save();
        for (const c of confetti) {
          const x = W / 2 + Math.cos(c.a) * c.v * u, y = top + 600 + Math.sin(c.a) * c.v * u + 1100 * u * u;
          ctx.save(); ctx.translate(x, y); ctx.rotate(c.rot + c.vr * u); ctx.globalAlpha = clamp(1.6 - u, 0, 1);
          ctx.fillStyle = c.c; ctx.fillRect(-c.w / 2, -c.w / 4, c.w, c.w / 2); ctx.restore();
        }
        ctx.restore();
      }
    }
    nav(ctx, 2, 0);
    statusBar(ctx);
  }

  function render(ctx, t, ff) {
    ctx.save();
    if (t < 13.2) {
      if (t < 8.3) screenQuests(ctx, t);
      else screenShop(ctx, t);
      // tab switch: slide
      if (t >= 8.1 && t < 8.45) { const k = (t - 8.1) / 0.35; ctx.fillStyle = `rgba(0,0,0,${0.7 * Math.sin(k * Math.PI)})`; ctx.fillRect(0, 0, W, H); }
      font(ctx, 700, 20, FF, "normal", 4); ctx.textAlign = "right"; ctx.fillStyle = "rgba(244,244,240,0.35)";
      ctx.fillText("ILLUSTRATIVE EXAMPLE", W - 70, 290); ctx.textAlign = "left";
      overlay(ctx, t);
      // a recording dot: it reads as a screen recording
      ctx.fillStyle = `rgba(255,59,48,${0.6 + 0.4 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.arc(170, 66, 9, 0, TAU); ctx.fill();
      const out = smooth(12.95, 13.2, t);
      if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
      finish(ctx, t, { grain: 0.02, vignette: 0.15 });
    } else {
      endCard(ctx, t - 13.2, ff);
      finish(ctx, t);
    }
    ctx.restore();
  }
  window.Reel = { render, DUR, COVER: 2.6 };
})();
