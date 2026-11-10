// Reel 5, "Get sponsored" (17 s). Sports-campaign look: black studio, one spotlight, a shaded
// jersey, huge slanted condensed type. Pros get sponsors; amateurs get nothing. On LIMITLINE
// brands sponsor quests, so every time you beat your limit a brand patch lands on your jersey
// and you win their gear. The brands are the app's sample sponsors, so it says
// "Illustrative example" on screen.
(function () {
  const { W, H, TAU, VOLT, INK, lerp, clamp, smooth, easeOut, easeOutExpo, easeOutBack, rng, font, finish, endCard } = window.LL;
  const DUR = 17.5;
  const JY = 1060, JS = 0.86; // jersey centre and scale

  // ---------- Pieces ----------
  function spotlight(ctx, t, warm, flicker) {
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
    const f = flicker ? 0.75 + 0.25 * Math.sin(t * 37) * Math.sin(t * 23) : 1;
    const cone = ctx.createLinearGradient(0, 0, 0, H);
    const c = warm ? "206,255,0" : "255,255,255";
    cone.addColorStop(0, `rgba(${c},${0.0})`); cone.addColorStop(0.45, `rgba(${c},${0.07 * f})`); cone.addColorStop(1, `rgba(${c},${0.02 * f})`);
    ctx.fillStyle = cone;
    ctx.beginPath(); ctx.moveTo(W / 2 - 90, -40); ctx.lineTo(W / 2 + 90, -40); ctx.lineTo(W / 2 + 520, H * 0.82); ctx.lineTo(W / 2 - 520, H * 0.82); ctx.fill();
    const pool = ctx.createRadialGradient(W / 2, JY + 470, 0, W / 2, JY + 470, 520);
    pool.addColorStop(0, `rgba(${c},${0.16 * f})`); pool.addColorStop(1, `rgba(${c},0)`);
    ctx.save(); ctx.translate(0, JY + 470); ctx.scale(1, 0.22); ctx.translate(0, -(JY + 470));
    ctx.fillStyle = pool; ctx.fillRect(0, JY - 100, W, 1200); ctx.restore();
  }
  function jerseyPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-95, -385);
    ctx.quadraticCurveTo(0, -300, 95, -385);
    ctx.lineTo(235, -350); ctx.quadraticCurveTo(300, -320, 345, -225); ctx.lineTo(268, -150); ctx.lineTo(222, -205);
    ctx.quadraticCurveTo(232, 80, 238, 385); ctx.quadraticCurveTo(0, 405, -238, 385);
    ctx.quadraticCurveTo(-232, 80, -222, -205); ctx.lineTo(-268, -150); ctx.lineTo(-345, -225); ctx.quadraticCurveTo(-300, -320, -235, -350);
    ctx.closePath();
  }
  // Draws a jersey turned by `turn` (-1..1 squashes it like a slow 3D spin).
  function jersey(ctx, x, y, s, turn, tone, patches, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (0.86 + 0.14 * Math.cos(turn)), s);
    // contact shadow
    const sh = ctx.createRadialGradient(0, 470, 0, 0, 470, 330);
    sh.addColorStop(0, "rgba(0,0,0,0.55)"); sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.scale(1, 0.18); ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, 470 / 0.18, 330, 0, TAU); ctx.fill(); ctx.restore();
    jerseyPath(ctx);
    const lx = -60 + Math.sin(turn) * 120;
    const g = ctx.createLinearGradient(-260 + lx, 0, 260 + lx, 0);
    g.addColorStop(0, tone.lo); g.addColorStop(0.3, tone.hi); g.addColorStop(0.55, tone.mid); g.addColorStop(1, tone.lo);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    // fabric folds and a soft top light
    ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 10; ctx.lineCap = "round";
    for (const [a, b, c, d] of [[-150, -120, -110, 160], [140, -60, 170, 220], [-40, 120, 30, 330], [-205, 40, -190, 300]]) {
      ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c) / 2 + 30, (b + d) / 2, c, d); ctx.stroke();
    }
    const top = ctx.createLinearGradient(0, -400, 0, 400);
    top.addColorStop(0, "rgba(255,255,255,0.14)"); top.addColorStop(0.4, "rgba(255,255,255,0)"); top.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = top; ctx.fillRect(-400, -420, 800, 840);
    // trims
    if (tone.trim) { ctx.fillStyle = tone.trim; ctx.fillRect(-400, 330, 800, 18); ctx.save(); ctx.translate(0, 0); ctx.restore(); }
    for (const p of patches) patch(ctx, p, t);
    ctx.restore();
    // collar rib
    ctx.strokeStyle = tone.trim || "rgba(0,0,0,0.3)"; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(-95, -385); ctx.quadraticCurveTo(0, -300, 95, -385); ctx.stroke();
    ctx.restore();
  }
  // A stitched patch. kind: "moxa" (round), "haldo" (bar), "ll" (the LIMITLINE mark), or "gen" (pro jersey filler).
  function patch(ctx, p, t) {
    const k = p.k ?? 1;
    if (k <= 0) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r || 0); ctx.scale(k, k);
    ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    const ff = "Archivo, Inter, sans-serif";
    if (p.kind === "moxa") {
      ctx.fillStyle = "#1f3a2c"; ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#e9e6d8"; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.arc(0, 0, 60, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#e9e6d8"; ctx.beginPath(); ctx.moveTo(-34, 14); ctx.lineTo(-8, -26); ctx.lineTo(8, -6); ctx.lineTo(18, -18); ctx.lineTo(36, 14); ctx.fill();
      font(ctx, 900, 20, ff, "expanded", 2); ctx.textAlign = "center"; ctx.fillText("MOXA", 0, 40);
    } else if (p.kind === "haldo") {
      ctx.fillStyle = "#e9edf2"; ctx.beginPath(); ctx.roundRect(-92, -34, 184, 68, 14); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#2a5bd7"; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.roundRect(-84, -26, 168, 52, 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#2a5bd7"; ctx.beginPath(); ctx.moveTo(-62, 8); ctx.quadraticCurveTo(-50, -22, -38, 8); ctx.arc(-50, 8, 12, 0, Math.PI); ctx.fill();
      font(ctx, 900, 26, ff, "normal", 2); ctx.fillText("HALDO", -30, 10);
    } else if (p.kind === "ll") {
      ctx.fillStyle = "#0b0b0b"; ctx.beginPath(); ctx.roundRect(-110, -62, 220, 124, 18); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.strokeStyle = VOLT; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.roundRect(-100, -52, 200, 104, 12); ctx.stroke(); ctx.setLineDash([]);
      window.LL.mark(ctx, -40, -40, 1.9, 1, 1);
    } else {
      ctx.fillStyle = p.c; ctx.beginPath(); ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 10); ctx.fill(); ctx.shadowColor = "transparent";
      ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillRect(-p.w / 2 + 14, -6, p.w - 28, 12);
      const gl = ((t * 0.6 + p.x * 0.001) % 1.4) - 0.2;
      ctx.fillStyle = `rgba(255,255,255,${0.25 * Math.max(0, 1 - Math.abs(gl - 0.5) * 4)})`; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }
  const PRO_PATCHES = (() => {
    const r = rng(17), cols = ["#c0392b", "#1e6fd9", "#f2b705", "#7b2cbf", "#0f9d58", "#e4572e", "#222", "#ff7a00"];
    const spots = [[-140, -230], [130, -240], [0, -120], [-150, -60], [150, -50], [-120, 90], [120, 100], [0, 230], [-300, -240], [300, -240]];
    return spots.map(([x, y], i) => ({ kind: "gen", x, y, w: 110 + r() * 60, h: 46 + r() * 20, c: cols[i % cols.length], r: (r() - 0.5) * 0.2 }));
  })();

  // Slanted condensed headline lines.
  function hero(ctx, text, x, y, size, color, k, align = "left") {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.2, 1, 0, 0);
    const sc = lerp(1.35, 1, easeOutExpo(k)); ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(k * 2, 0, 1);
    font(ctx, 900, size, "Archivo, Inter, sans-serif", "extra-condensed", 0);
    const w = ctx.measureText(text).width;
    if (w > 860) font(ctx, 900, size * 860 / w, "Archivo, Inter, sans-serif", "extra-condensed", 0);
    ctx.textAlign = align; ctx.fillStyle = color;
    if (color === VOLT) { ctx.shadowColor = "rgba(206,255,0,0.5)"; ctx.shadowBlur = 30; }
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // ---------- The three quests ----------
  const BEATS = [
    { at: 6.9, quest: "Climb 1000 m", brand: "MOXA TRAIL", pct: "+6.2%", won: "MOXA trail socks", p: { kind: "moxa", x: -128, y: -200, r: -0.12 } },
    { at: 8.7, quest: "Run 10 km", brand: "HALDO", pct: "+3.4%", won: "HALDO electrolyte pack", p: { kind: "haldo", x: 112, y: -215, r: 0.08 } },
    { at: 10.5, quest: "Ride 40 km", brand: "LIMITLINE", pct: "+4.8%", won: "double embers", p: { kind: "ll", x: 0, y: 30, r: -0.03 } },
  ];
  function questCard(ctx, b, t, ff) {
    const u = t - b.at, k = easeOutExpo(u / 0.4), out = smooth(1.55, 1.8, u);
    if (k <= 0 || out >= 1) return;
    ctx.save(); ctx.globalAlpha = (1 - out); ctx.translate((1 - k) * -700, 0);
    ctx.fillStyle = "rgba(18,19,22,0.92)"; ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(90, 250, 900, 230, 34); ctx.fill(); ctx.stroke();
    font(ctx, 700, 26, ff, "normal", 4); ctx.fillStyle = "rgba(244,244,240,0.6)"; ctx.fillText(`QUEST · SPONSORED BY ${b.brand}`, 134, 312);
    font(ctx, 900, 84, ff, "condensed"); ctx.fillStyle = INK; ctx.fillText(b.quest, 130, 408);
    // the result stamp
    const st = easeOutBack((u - 0.5) / 0.25);
    if (st > 0) {
      ctx.save(); ctx.translate(800, 380); ctx.rotate(-0.12); ctx.scale(lerp(2.2, 1, clamp(st, 0, 1)), lerp(2.2, 1, clamp(st, 0, 1))); ctx.globalAlpha *= clamp(st, 0, 1);
      ctx.strokeStyle = VOLT; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-150, -70, 300, 140, 16); ctx.stroke();
      font(ctx, 900, 70, ff, "semi-expanded"); ctx.textAlign = "center"; ctx.fillStyle = VOLT; ctx.fillText(b.pct, 0, 14);
      font(ctx, 800, 20, ff, "normal", 3); ctx.fillText("BEYOND YOUR LIMIT", 0, 50);
      ctx.restore();
    }
    ctx.restore();
    // the reward toast
    const tk = easeOutBack((u - 0.95) / 0.35) * (1 - out);
    if (tk > 0) {
      ctx.save(); ctx.globalAlpha = clamp(tk, 0, 1); ctx.translate(W / 2, 1530); ctx.scale(clamp(tk, 0, 1.1), clamp(tk, 0, 1.1));
      font(ctx, 800, 40, ff); const label = `WON: ${b.won}`; const w = ctx.measureText(label).width + 90;
      ctx.fillStyle = VOLT; ctx.beginPath(); ctx.roundRect(-w / 2, -48, w, 96, 48); ctx.fill();
      ctx.fillStyle = "#0b0b0b"; ctx.textAlign = "center"; ctx.fillText(label, 0, 14);
      ctx.restore();
    }
  }

  function render(ctx, t, ff) {
    ctx.save();
    if (t < 14.6) {
      const pro = t < 2.6;
      const warm = t >= 4.8;
      spotlight(ctx, t, warm, t >= 2.6 && t < 4.8);
      const push = pro ? lerp(1, 1.06, t / 2.6) : lerp(1, 1.05, smooth(4.8, 14.6, t));
      ctx.save(); ctx.translate(W / 2, JY); ctx.scale(push, push); ctx.translate(-W / 2, -JY);
      if (pro) {
        jersey(ctx, W / 2, JY, JS, Math.sin(t * 0.9) * 0.6, { hi: "#4a4d55", mid: "#2b2d33", lo: "#121316", trim: VOLT }, PRO_PATCHES, t);
      } else {
        // plain jersey: grey and flat, then patches land one by one
        const patches = BEATS.map((b) => ({ ...b.p, k: easeOutBack((t - b.at - 0.9) / 0.3) * (t > b.at + 0.9 ? 1 : 0) + 0 }))
          .map((p) => ({ ...p, k: clamp(p.k, 0, 1.15) }));
        const lit = smooth(12.2, 12.8, t);
        const tone = lit > 0.5
          ? { hi: "#f1f0ea", mid: "#c9c8c0", lo: "#5f5e58", trim: VOLT }
          : { hi: "#d8d7d0", mid: "#a9a8a1", lo: "#4f4e49" };
        jersey(ctx, W / 2, JY + (t < 3.0 ? (1 - easeOut((t - 2.6) / 0.4)) * 40 : 0), JS, Math.sin(t * 0.7) * 0.25, tone, patches, t);
        // a shock ring where each patch lands
        for (const b of BEATS) {
          const u = t - b.at - 0.9;
          if (u > 0 && u < 0.45) {
            const x = W / 2 + b.p.x * JS, y = JY + b.p.y * JS;
            ctx.strokeStyle = `rgba(206,255,0,${0.8 * (1 - u / 0.45)})`; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(x, y, 60 + u * 420, 0, TAU); ctx.stroke();
          }
        }
        if (lit > 0) {
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 * lit;
          const rim = ctx.createRadialGradient(W / 2, JY, 200, W / 2, JY, 520);
          rim.addColorStop(0, "rgba(206,255,0,0)"); rim.addColorStop(0.7, "rgba(206,255,0,0.12)"); rim.addColorStop(1, "rgba(206,255,0,0)");
          ctx.fillStyle = rim; ctx.fillRect(0, JY - 600, W, 1200); ctx.restore();
        }
      }
      ctx.restore();

      // headlines
      if (pro) {
        hero(ctx, "PROS GET", 100, 330, 200, INK, (t - 0.2) / 0.3);
        hero(ctx, "SPONSORS.", 100, 520, 200, VOLT, (t - 0.65) / 0.3);
      } else if (t < 4.8) {
        hero(ctx, "YOU GET...", 100, 330, 200, INK, (t - 2.7) / 0.3);
        hero(ctx, "NOTHING.", 100, 520, 200, "#6d6c66", (t - 3.6) / 0.3);
      } else if (t < 6.85) {
        hero(ctx, "UNTIL", 100, 330, 200, INK, (t - 4.85) / 0.25);
        hero(ctx, "NOW.", 100, 520, 200, VOLT, (t - 5.15) / 0.25);
        const ex = easeOut((t - 5.6) / 0.4) * (1 - smooth(6.6, 6.85, t));
        if (ex > 0) {
          ctx.save(); ctx.globalAlpha = ex; font(ctx, 700, 40, ff); ctx.fillStyle = INK; ctx.textAlign = "center";
          ctx.fillText("Brands sponsor quests.", W / 2, 1500); ctx.fillStyle = VOLT; ctx.fillText("Beat your limit, win their gear.", W / 2, 1556);
          ctx.restore();
        }
      } else if (t < 12.2) {
        for (const b of BEATS) questCard(ctx, b, t, ff);
      } else {
        hero(ctx, "GET SPONSORED", 100, 330, 170, INK, (t - 12.25) / 0.3);
        hero(ctx, "LIKE A PRO.", 100, 500, 170, VOLT, (t - 12.6) / 0.3);
      }
      // the volt flash on "NOW."
      const fl = Math.exp(-Math.max(0, t - 5.15) * 8) * (t >= 5.15 ? 1 : 0);
      if (fl > 0.01) { ctx.fillStyle = `rgba(206,255,0,${0.3 * fl})`; ctx.fillRect(0, 0, W, H); }
      // hard cut to black at 2.6
      if (t > 2.6 && t < 2.75) { ctx.fillStyle = `rgba(0,0,0,${1 - (t - 2.6) / 0.15})`; ctx.fillRect(0, 0, W, H); }
      if (t > 4.8) {
        ctx.save(); font(ctx, 700, 22, ff, "normal", 4); ctx.textAlign = "right"; ctx.fillStyle = "rgba(244,244,240,0.45)";
        ctx.fillText("ILLUSTRATIVE EXAMPLE · SAMPLE BRANDS", W - 90, 190); ctx.restore();
      }
      const out = smooth(14.3, 14.6, t);
      if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
    } else {
      endCard(ctx, t - 14.6, ff);
    }
    finish(ctx, t);
    ctx.restore();
  }
  window.Reel = { render, DUR, COVER: 12.9 };
})();
