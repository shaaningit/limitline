// Reel 2, "The beginner beat the pro" (16 s). Light Swiss-poster look: bone paper, black ink,
// huge condensed type and hard cuts on the beat. Story: every other app ranks the fastest time;
// LIMITLINE ranks % beyond your own limit, so a beginner's +6.0% beats a pro's +0.5%.
// Numbers follow the app's rule for time quests, (limit - result) / limit:
//   Maya 38:40 -> 36:20 = 140 / 2320 = +6.0%.  Leo 15:10 -> 15:05 = 5 / 910 = +0.5%.
(function () {
  const { W, H, VOLT, BLACK, BONE, lerp, clamp, smooth, easeOut, easeOutExpo, easeOutBack, easeInOut, font, captions, finish } = window.LL;
  const DUR = 16;
  const GREY = "#9b9a93";
  const CAPTIONS = [
    { a: 2.55, b: 4.55, words: "On every other app the *FASTEST* time wins." },
    { a: 4.65, b: 6.0, words: "So Maya *NEVER* wins." },
    { a: 6.2, b: 8.45, words: "Here you race your *OWN* limit." },
    { a: 8.6, b: 10.0, words: "*+6.0%* beats *+0.5%.*" },
    { a: 10.3, b: 13.1, words: "The board ranks *EFFORT.* Not talent." },
  ];

  function paper(ctx, t, ff) {
    ctx.fillStyle = BONE; ctx.fillRect(0, 0, W, H);
    // Swiss grid and registration marks
    ctx.strokeStyle = "rgba(11,11,11,0.07)"; ctx.lineWidth = 2;
    for (let x = 90; x < W; x += 225) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.strokeStyle = "rgba(11,11,11,0.5)"; ctx.lineWidth = 2;
    for (const [x, y] of [[60, 120], [W - 60, 120], [60, H - 120], [W - 60, H - 120]]) {
      ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y); ctx.moveTo(x, y - 18); ctx.lineTo(x, y + 18); ctx.stroke();
    }
    ctx.fillStyle = "rgba(11,11,11,0.55)";
    font(ctx, 700, 26, ff, "normal", 5);
    ctx.fillText("FIG. 02", 90, 190);
    ctx.textAlign = "right"; ctx.fillText(`5 KM RUN · T+${t.toFixed(1).padStart(4, "0")}`, W - 90, 190);
    if (t > 2.4) ctx.fillText("ILLUSTRATIVE EXAMPLE", W - 90, 228);
    ctx.textAlign = "left";
  }

  // A flat, faceless athlete pictogram. kind: "maya" (ponytail) or "leo" (headband).
  function avatar(ctx, x, y, s, kind, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(-46, -10, 92, 110, [40, 40, 12, 12]); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -52, 36, 0, Math.PI * 2); ctx.fill();
    if (kind === "maya") { ctx.beginPath(); ctx.ellipse(34, -64, 16, 24, 0.6, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = VOLT; ctx.fillRect(-37, -66, 74, 12); }
    ctx.restore();
  }

  // ---------- A: the hook, three slammed lines ----------
  function hook(ctx, t, ff) {
    const lines = [
      { s: "THIS BEGINNER", at: 0.12, y: 640 },
      { s: "JUST BEAT", at: 0.57, y: 900 },
      { s: "A PRO.", at: 1.02, y: 1240, hot: true },
    ];
    const exit = easeInOut((t - 2.05) / 0.35);
    ctx.save(); ctx.translate(0, -exit * 1400);
    for (const ln of lines) {
      const k = clamp((t - ln.at) / 0.22, 0, 1);
      if (k <= 0) continue;
      const sc = lerp(1.6, 1, easeOutExpo(k));
      const size = ln.hot ? 330 : 220;
      font(ctx, 900, size, ff, "extra-condensed", -2);
      let w = ctx.measureText(ln.s).width;
      if (w > 940) { font(ctx, 900, size * 940 / w, ff, "extra-condensed", -2); w = 940; }
      ctx.save(); ctx.translate(W / 2, ln.y); ctx.scale(sc, sc);
      ctx.globalAlpha = Math.min(1, k * 2);
      if (ln.hot) {
        const wipe = easeOut((t - ln.at - 0.15) / 0.3);
        ctx.fillStyle = VOLT; ctx.fillRect(-w / 2 - 30, -size * 0.78, (w + 60) * wipe, size * 0.9);
      }
      ctx.fillStyle = BLACK; ctx.textAlign = "center"; ctx.fillText(ln.s, 0, 0);
      ctx.restore();
    }
    ctx.restore();
    // impact ticks under each slam
    for (const ln of lines) {
      const k = (t - ln.at) / 0.25;
      if (k > 0 && k < 1) { ctx.strokeStyle = `rgba(11,11,11,${0.5 * (1 - k)})`; ctx.lineWidth = 4; ctx.strokeRect(60 - k * 20, 260 - k * 20, W - 120 + k * 40, H - 520 + k * 40); }
    }
  }

  // ---------- B and C: the two athletes, ranked two ways ----------
  const ROW_Y = [640, 1040];
  function rows(ctx, t, ff) {
    const u = t - 2.4;
    const inK = (d) => easeOutExpo((u - d) / 0.5);
    // section title: "EVERY OTHER APP", struck through, then "LIMITLINE"
    const swap = smooth(6.0, 6.25, t);
    ctx.save();
    font(ctx, 900, 128, ff, "extra-condensed");
    ctx.fillStyle = BLACK;
    if (swap < 1) {
      ctx.globalAlpha = inK(0) * (1 - swap);
      ctx.fillText("EVERY OTHER APP", 90 - (1 - inK(0)) * 200, 400);
      const strike = easeOut((t - 5.0) / 0.35);
      if (strike > 0) { ctx.fillStyle = BLACK; ctx.fillRect(84, 356, 900 * strike, 14); }
    }
    if (swap > 0) {
      ctx.globalAlpha = swap; ctx.fillText("LIMITLINE", 90 + (1 - swap) * 120, 400);
            font(ctx, 700, 30, ff, "normal", 4);
      ctx.fillStyle = "rgba(11,11,11,0.6)"; ctx.fillText("RANKED BY % BEYOND OWN LIMIT", 94 + (1 - swap) * 120, 456);
    }
    ctx.restore();

    // ranking order: Leo first by time, Maya first by effort (swaps at 8.65)
    const order = easeInOut((t - 8.65) / 0.45);
    const athletes = [
      { kind: "leo", name: "LEO", tag: "pro", limit: "15:10", now: "15:05", speed: 1.0, pct: 0.5, row0: 0, row1: 1 },
      { kind: "maya", name: "MAYA", tag: "beginner", limit: "38:40", now: "36:20", speed: 910 / 2320, pct: 6.0, row0: 1, row1: 0 },
    ];
    const effort = smooth(6.3, 6.9, t); // bars morph from speed to "own limit"
    const grow = easeOut((t - 7.2) / 1.2); // results grow beyond the limit
    for (const [i, a] of athletes.entries()) {
      const k = inK(0.25 + i * 0.15);
      if (k <= 0) continue;
      const y = lerp(ROW_Y[a.row0], ROW_Y[a.row1], order) + (1 - k) * 80;
      ctx.save(); ctx.globalAlpha = k;
      const winner = a.kind === "maya" ? order : 1 - order;
      avatar(ctx, 160, y + 20, 1, a.kind, BLACK);
      font(ctx, 900, 74, ff, "condensed");
      ctx.fillStyle = BLACK; ctx.fillText(a.name, 250, y);
      const nw = ctx.measureText(a.name).width;
      font(ctx, 700, 30, ff, "normal", 2);
      ctx.fillStyle = "rgba(11,11,11,0.55)"; ctx.fillText(a.tag.toUpperCase(), 250 + nw + 20, y - 8);
      font(ctx, 600, 36, ff);
      ctx.fillStyle = BLACK;
      ctx.fillText(effort < 0.5 ? `5 km in ${a.limit}` : `limit ${a.limit}  →  ${grow > 0.6 ? a.now : a.limit}`, 250, y + 52);
      // rank number on the right
      font(ctx, 900, 150, ff, "extra-condensed");
      ctx.textAlign = "right";
      const rank = (t < 8.65 ? a.row0 : (order > 0.5 ? a.row1 : a.row0)) + 1;
      ctx.fillStyle = rank === 1 ? BLACK : "rgba(11,11,11,0.25)";
      ctx.fillText(`#${rank}`, W - 90, y + 50);
      ctx.textAlign = "left";
      // the bar
      const bx = 90, by = y + 90, maxW = 900, base = 560;
      const wSpeed = maxW * a.speed * easeOut((u - 0.6 - i * 0.15) / 0.8);
      const wBar = lerp(wSpeed, base, effort);
      ctx.fillStyle = effort > 0.5 ? BLACK : (a.kind === "leo" ? BLACK : GREY);
      ctx.fillRect(bx, by, wBar, 64);
      if (effort > 0) {
        // dashed limit marker
        ctx.save(); ctx.globalAlpha = k * effort; ctx.setLineDash([12, 10]); ctx.strokeStyle = BLACK; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bx + base, by - 16); ctx.lineTo(bx + base, by + 78); ctx.stroke(); ctx.restore();
        // the effort beyond the limit, exaggerated x34 so it reads
        const ext = a.pct * 30 * grow;
        ctx.fillStyle = VOLT; ctx.fillRect(bx + base, by, ext, 64);
        ctx.strokeStyle = BLACK; ctx.lineWidth = 3; if (ext > 2) ctx.strokeRect(bx + base, by, ext, 64);
        font(ctx, 900, 52, ff, "condensed");
        const shown = (a.pct * clamp(grow * 1.1, 0, 1)).toFixed(1);
        ctx.fillStyle = BLACK; ctx.fillText(`+${shown}%`, bx + base + ext + 18, by + 52);
        if (i === 0) {
          font(ctx, 700, 22, ff, "normal", 3); ctx.fillStyle = "rgba(11,11,11,0.6)";
          ctx.textAlign = "center"; ctx.globalAlpha = k * effort * (1 - smooth(8.5, 8.65, t)); ctx.fillText("OWN LIMIT", bx + base, by + 104); ctx.textAlign = "left";
        }
      }
      // winner glow sweep
      if (winner > 0.5 && t > 8.9) {
        const sw = easeOut((t - 8.9) / 0.5);
        ctx.fillStyle = `rgba(206,255,0,${0.35 * (1 - sw)})`; ctx.fillRect(60, y - 90, W - 120, 260);
      }
      ctx.restore();
    }
  }

  // ---------- D: the weekly board ----------
  const BOARD = [
    { n: "MAYA", tag: "beginner", p: 6.0 },
    { n: "SAM", tag: "first year", p: 4.1 },
    { n: "PRIYA", tag: "age 52", p: 2.7 },
    { n: "LEO", tag: "pro", p: 0.5 },
    { n: "JONAS", tag: "club runner", p: 0.3 },
  ];
  function board(ctx, t, ff) {
    const u = t - 10.0;
    font(ctx, 900, 128, ff, "extra-condensed");
    ctx.fillStyle = BLACK; ctx.globalAlpha = easeOut(u / 0.3);
    ctx.fillText("THIS WEEK", 90, 400);
    font(ctx, 700, 30, ff, "normal", 4); ctx.fillStyle = "rgba(11,11,11,0.6)";
    ctx.fillText("RUN · % BEYOND OWN LIMIT", 94, 456);
    ctx.globalAlpha = 1;
    BOARD.forEach((r, i) => {
      const k = easeOutExpo((u - 0.15 - i * 0.12) / 0.5);
      if (k <= 0) return;
      const y = 540 + i * 150;
      ctx.save(); ctx.translate((1 - k) * 600, 0); ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = i === 0 ? VOLT : "rgba(11,11,11,0.05)";
      ctx.fillRect(90, y, 900, 124);
      if (i === 0) { ctx.strokeStyle = BLACK; ctx.lineWidth = 4; ctx.strokeRect(90, y, 900, 124); }
      font(ctx, 900, 84, ff, "extra-condensed"); ctx.fillStyle = BLACK;
      ctx.fillText(String(i + 1), 120, y + 92);
      font(ctx, 900, 60, ff, "condensed"); ctx.fillText(r.n, 210, y + 70);
      font(ctx, 600, 28, ff); ctx.fillStyle = "rgba(11,11,11,0.6)"; ctx.fillText(r.tag, 212, y + 104);
      font(ctx, 900, 76, ff, "condensed"); ctx.textAlign = "right"; ctx.fillStyle = BLACK;
      ctx.fillText(`+${r.p.toFixed(1)}%`, 960, y + 88);
      ctx.restore();
    });
  }

  // ---------- E: end card on black ----------
  function render(ctx, t, ff) {
    ctx.save();
    if (t < 13.2) {
      paper(ctx, t, ff);
      if (t < 2.45) hook(ctx, t, ff);
      else if (t < 10.0) rows(ctx, t, ff);
      else board(ctx, t, ff);
      // whip cut into the rows and into the board
      for (const c of [2.4, 10.0]) {
        const k = 1 - (t - c) / 0.18;
        if (k > 0 && k <= 1) { ctx.fillStyle = `rgba(11,11,11,${0.9 * k})`; ctx.fillRect(0, H * (1 - k), W, H * k); }
      }
      captions(ctx, t, CAPTIONS, ff, { style: "box", y: 1520, size: 80 });
      finish(ctx, t, { grain: 0.08, grainColor: "#000", vignette: 0.18 });
    } else {
      const u = t - 13.2;
      // a two-beat type slam on black, then the logo
      if (u < 1.0) {
        ctx.fillStyle = "#070707"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        const a = easeOutBack(u / 0.2), b = easeOutBack((u - 0.4) / 0.2);
        font(ctx, 900, 230, ff, "extra-condensed");
        ctx.fillStyle = "#f4f4f0"; ctx.save(); ctx.translate(W / 2, 860); ctx.scale(lerp(1.5, 1, a), lerp(1.5, 1, a)); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillText("BEAT YOUR", 0, 0); ctx.restore();
        if (b > 0) { ctx.fillStyle = VOLT; ctx.save(); ctx.translate(W / 2, 1100); ctx.scale(lerp(1.5, 1, b), lerp(1.5, 1, b)); ctx.globalAlpha = clamp(b, 0, 1); ctx.fillText("OWN LIMIT.", 0, 0); ctx.restore(); }
      } else {
        window.LL.endCard(ctx, u - 1.0, ff, { tagline: "Effort beats talent." });
      }
      finish(ctx, t);
    }
    ctx.restore();
  }
  window.Reel = { render, DUR, COVER: 1.6, CAPTIONS };
})();
