// Reel 4, "For brands" (19 s). A pitch you can attach to sponsor emails or post on LinkedIn.
// Editorial look: an aurora background, glass cards floating in 3D, left-aligned headlines
// that slide up out of a mask. The brand is a placeholder ("YOUR BRAND") so any partner can
// picture themselves in it. No made-up user numbers: it shows how a sponsored quest works.
(function () {
  const { W, H, TAU, VOLT, INK, lerp, clamp, smooth, easeOut, easeOutExpo, easeOutBack, easeInOut, font, finish, endCard } = window.LL;
  const DUR = 19;
  const SCENES = [
    { a: 0, b: 3.0, n: "", lines: ["What if your ad", "was someone's", "*personal best?*"] },
    { a: 3.0, b: 6.6, n: "01", lines: ["Put your brand", "on a *quest.*"] },
    { a: 6.6, b: 10.2, n: "02", lines: ["Athletes push past", "their *own limit*", "to complete it."] },
    { a: 10.2, b: 13.6, n: "03", lines: ["They *post* about it.", "Real people, real sweat."] },
    { a: 13.6, b: 16.2, n: "04", lines: ["Your gear becomes", "the *reward.*"] },
  ];

  function aurora(ctx, t) {
    ctx.fillStyle = "#08090b"; ctx.fillRect(0, 0, W, H);
    const blobs = [
      { x: 0.2 + 0.08 * Math.sin(t * 0.4), y: 0.25 + 0.05 * Math.cos(t * 0.3), r: 0.75, c: "206,255,0", a: 0.16 },
      { x: 0.85 + 0.06 * Math.cos(t * 0.35), y: 0.55 + 0.08 * Math.sin(t * 0.25), r: 0.7, c: "64,190,170", a: 0.14 },
      { x: 0.4 + 0.1 * Math.sin(t * 0.2 + 2), y: 0.95, r: 0.8, c: "120,110,255", a: 0.1 },
    ];
    for (const b of blobs) {
      const g = ctx.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, b.r * H);
      g.addColorStop(0, `rgba(${b.c},${b.a})`); g.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // a faint perspective floor grid
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 2;
    const hz = H * 0.62;
    for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 30, hz); ctx.lineTo(W / 2 + i * 260, H); ctx.stroke(); }
    for (let k = 0; k < 9; k++) { const y = hz + Math.pow(k / 8, 2) * (H - hz) + ((t * 40) % 40) * (k / 8); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  // Headline that slides up out of a mask, line by line. *words* are volt.
  function headline(ctx, t, sc, ff) {
    const u = t - sc.a, out = smooth(sc.b - 0.35, sc.b - 0.05, t);
    const size = 88, lh = 100, x0 = 90, y0 = 330;
    ctx.save();
    if (sc.n) {
      const k = easeOutExpo(u / 0.5);
      font(ctx, 800, 30, ff, "normal", 6); ctx.fillStyle = VOLT; ctx.globalAlpha = k * (1 - out);
      ctx.fillText(`${sc.n} —`, x0, y0 - 110);
      ctx.fillStyle = "rgba(206,255,0,0.5)"; ctx.fillRect(x0 + 110, y0 - 120, 160 * k, 3);
      ctx.globalAlpha = 1;
    }
    sc.lines.forEach((line, i) => {
      const k = easeOutExpo((u - 0.1 - i * 0.12) / 0.7);
      const y = y0 + i * lh;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, y - size, W, lh + 10); ctx.clip();
      ctx.translate(0, (1 - k) * lh - out * lh * 1.1);
      font(ctx, 800, size, ff, "semi-condensed", -1);
      let x = x0;
      for (const part of line.split(/(\*[^*]+\*)/)) {
        if (!part) continue;
        const hot = part.startsWith("*");
        const s = part.replace(/\*/g, "");
        ctx.fillStyle = hot ? VOLT : INK;
        if (hot) { ctx.shadowColor = "rgba(206,255,0,0.45)"; ctx.shadowBlur = 24; } else ctx.shadowBlur = 0;
        ctx.fillText(s, x, y);
        x += ctx.measureText(s).width;
      }
      ctx.restore();
    });
    ctx.restore();
  }

  // A glass card floating in 3D: rotY turns it left/right, rotX tips it back.
  function card(ctx, cx, cy, w, h, ry, rx, s, draw, o = {}) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.transform(Math.cos(ry), Math.sin(ry) * 0.18, Math.sin(rx) * -0.12, Math.cos(rx), 0, 0);
    ctx.scale(s, s);
    ctx.globalAlpha = o.alpha ?? 1;
    // thickness and drop shadow
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 70; ctx.shadowOffsetY = 40;
    ctx.fillStyle = "rgba(30,32,36,0.92)";
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2 + 10, w, h, 40); ctx.fill();
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, "rgba(58,60,66,0.95)"); g.addColorStop(0.5, "rgba(24,25,28,0.95)"); g.addColorStop(1, "rgba(34,36,40,0.95)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 40); ctx.fill();
    ctx.strokeStyle = o.hot ? "rgba(206,255,0,0.6)" : "rgba(255,255,255,0.16)"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 40); ctx.clip();
    draw(ctx, w, h);
    // a glass sheen sweeping across
    const sx = ((o.t ?? 0) * 0.35 % 1.6 - 0.3) * w * 2 - w;
    const sg = ctx.createLinearGradient(sx - 200, -h / 2, sx + 200, h / 2);
    sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.07)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.restore();
  }

  function brandMark(ctx, x, y, s) {
    // a deliberately generic placeholder logo: a ring and a dot
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.stroke();
    ctx.fillStyle = VOLT; ctx.beginPath(); ctx.arc(10, -10, 9, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function questCard(ff) {
    return (ctx, w, h) => {
      const L = -w / 2 + 50;
      ctx.fillStyle = "rgba(206,255,0,0.1)"; ctx.fillRect(-w / 2, -h / 2, w, 150);
      font(ctx, 700, 24, ff, "normal", 5); ctx.fillStyle = "rgba(244,244,240,0.6)"; ctx.fillText("SPONSORED QUEST", L, -h / 2 + 62);
      brandMark(ctx, L + 30, -h / 2 + 108, 0.9);
      font(ctx, 900, 40, ff, "expanded", 2); ctx.fillStyle = INK; ctx.fillText("YOUR BRAND", L + 80, -h / 2 + 122);
      font(ctx, 800, 66, ff, "semi-condensed"); ctx.fillStyle = INK;
      ctx.fillText("Ride 40 km", L, -h / 2 + 260); ctx.fillText("this weekend", L, -h / 2 + 334);
      const tags = ["BIKE", "40 KM", "SAT–SUN"];
      let tx = L;
      font(ctx, 700, 26, ff, "normal", 3);
      for (const tg of tags) {
        const tw = ctx.measureText(tg).width + 40;
        ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(tx, -h / 2 + 380, tw, 52, 26); ctx.stroke();
        ctx.fillStyle = "rgba(244,244,240,0.8)"; ctx.fillText(tg, tx + 20, -h / 2 + 415); tx += tw + 14;
      }
      // reward row
      ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.beginPath(); ctx.roundRect(L - 10, -h / 2 + 470, w - 80, 130, 26); ctx.fill();
      bottle(ctx, L + 50, -h / 2 + 535, 0.42);
      font(ctx, 600, 26, ff); ctx.fillStyle = "rgba(244,244,240,0.6)"; ctx.fillText("Reward", L + 110, -h / 2 + 520);
      font(ctx, 800, 36, ff); ctx.fillStyle = INK; ctx.fillText("Your product + 2× embers", L + 110, -h / 2 + 566);
    };
  }
  function bottle(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, "#f4f4f0"); g.addColorStop(0.45, "#a9a8a1"); g.addColorStop(1, "#45443f");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-56, -120, 112, 250, 36); ctx.fill();
    ctx.fillStyle = VOLT; ctx.fillRect(-56, -10, 112, 46);
    ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.roundRect(-30, -160, 60, 46, 10); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(-40, -100, 10, 200);
    ctx.restore();
  }

  const RIDERS = [
    { i: "AK", km: "41.2 km", p: "+3.1%" }, { i: "JM", km: "40.6 km", p: "+5.4%" }, { i: "SR", km: "44.0 km", p: "+2.2%" },
    { i: "LT", km: "40.1 km", p: "+7.9%" }, { i: "PN", km: "42.8 km", p: "+1.6%" }, { i: "DO", km: "40.3 km", p: "+4.4%" },
  ];
  function riderRow(ctx, x, y, r, k, ff) {
    ctx.save(); ctx.globalAlpha = k; ctx.translate(x + (1 - k) * 200, y);
    ctx.fillStyle = "rgba(24,26,30,0.9)"; ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(0, 0, 900, 118, 30); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(40, 20, 110, 100); g.addColorStop(0, "#5c5e66"); g.addColorStop(1, "#2a2c31");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(80, 59, 38, 0, TAU); ctx.fill();
    font(ctx, 800, 28, ff); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.fillText(r.i, 80, 69); ctx.textAlign = "left";
    font(ctx, 800, 36, ff); ctx.fillText(`Rode ${r.km}`, 146, 54);
    font(ctx, 600, 24, ff); ctx.fillStyle = "rgba(244,244,240,0.55)"; ctx.fillText("checked with Strava", 146, 90);
    // check badge
    ctx.fillStyle = VOLT; ctx.beginPath(); ctx.arc(140 + 245, 82, 12, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#0b0b0b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(379, 82); ctx.lineTo(384, 88); ctx.lineTo(392, 76); ctx.stroke();
    font(ctx, 900, 52, ff, "semi-expanded"); ctx.textAlign = "right"; ctx.fillStyle = VOLT; ctx.fillText(r.p, 860, 66);
    font(ctx, 600, 22, ff); ctx.fillStyle = "rgba(244,244,240,0.55)"; ctx.fillText("beyond own limit", 860, 96);
    ctx.restore();
  }

  // Vector "photos" for the post tiles.
  function photo(ctx, kind, w, h, t) {
    const sky = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    const pal = { ride: ["#2b3a2a", "#a9c46a"], run: ["#1d2433", "#e0a36b"], swim: ["#0e2a36", "#5fc3d6"], hike: ["#2a2233", "#e6b48a"], road: ["#18202a", "#ceff00"], peak: ["#22262e", "#f0e6d0"] }[kind];
    sky.addColorStop(0, pal[0]); sky.addColorStop(1, pal[1]);
    ctx.fillStyle = sky; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "rgba(255,240,200,0.8)"; ctx.beginPath(); ctx.arc(w * 0.22, -h * 0.18, w * 0.09, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.moveTo(-w / 2, h * 0.1); ctx.lineTo(-w * 0.15, -h * 0.12); ctx.lineTo(w * 0.1, h * 0.04); ctx.lineTo(w * 0.32, -h * 0.2); ctx.lineTo(w / 2, h * 0.05); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(-w / 2, h * 0.22, w, h * 0.3);
    // the athlete silhouette
    ctx.save(); ctx.translate(-w * 0.05 + Math.sin(t * 2) * 4, h * 0.2); ctx.fillStyle = "#0b0b0b"; ctx.strokeStyle = "#0b0b0b"; ctx.lineCap = "round";
    if (kind === "ride" || kind === "road") {
      ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-34, 0, 24, 0, TAU); ctx.arc(34, 0, 24, 0, TAU); ctx.stroke();
      ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-10, -30); ctx.lineTo(20, -60); ctx.stroke();
      ctx.beginPath(); ctx.arc(28, -72, 11, 0, TAU); ctx.fill();
    } else if (kind === "swim") {
      ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(30, -6); ctx.stroke();
      ctx.beginPath(); ctx.arc(46, -8, 12, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -6); ctx.quadraticCurveTo(30, -50, 60, -30); ctx.stroke();
    } else {
      ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(6, -64); ctx.moveTo(0, -20); ctx.lineTo(-22, 10); ctx.moveTo(0, -20); ctx.lineTo(24, 6); ctx.moveTo(6, -56); ctx.lineTo(30, -40); ctx.moveTo(6, -56); ctx.lineTo(-18, -44); ctx.stroke();
      ctx.beginPath(); ctx.arc(8, -82, 12, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  const POSTS = ["ride", "run", "swim", "hike", "road", "peak"];
  function postTile(ctx, kind, i, t, ff) {
    return (c, w, h) => {
      c.save(); c.translate(0, -40); c.beginPath(); c.roundRect(-w / 2 + 16, -h / 2 + 56, w - 32, h - 150, 24); c.clip();
      photo(c, kind, w - 32, h - 150, t + i); c.restore();
      c.fillStyle = "#5c5e66"; c.beginPath(); c.arc(-w / 2 + 40, -h / 2 + 30, 14, 0, TAU); c.fill();
      font(c, 700, 20, ff); c.fillStyle = "rgba(244,244,240,0.7)"; c.fillText("athlete", -w / 2 + 62, -h / 2 + 37);
      font(c, 800, 22, ff); c.fillStyle = VOLT; c.fillText("#YourBrandQuest", -w / 2 + 24, h / 2 - 40);
      // heart
      c.save(); c.translate(w / 2 - 40, h / 2 - 48); c.fillStyle = "rgba(244,244,240,0.85)";
      c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-16, -4, -10, -16, 0, -8); c.bezierCurveTo(10, -16, 16, -4, 0, 8); c.fill(); c.restore();
    };
  }

  function render(ctx, t, ff) {
    ctx.save();
    if (t < 16.2) {
      aurora(ctx, t);
      const sc = SCENES.find((s) => t >= s.a && t < s.b) || SCENES[SCENES.length - 1];
      // the quest card lives through scenes 0 to 2
      if (t < 10.2) {
        const k = easeOutBack((t - 0.5) / 1.1);
        let cx = W / 2, cy = 1130, s = lerp(0.6, 0.92, clamp(k, 0, 1.1)), ry = lerp(1.2, -0.18, easeOut((t - 0.5) / 1.4)), rx = 0.25;
        ry += Math.sin(t * 0.9) * 0.05;
        const back = easeInOut((t - 6.6) / 0.8);
        cy = lerp(cy, 770, back); s = lerp(s, 0.5, back); ry = lerp(ry, 0.12, back);
        const a = t < 3.0 ? smooth(0.5, 0.9, t) * 0.55 : 1 - back * 0.55;
        if (t > 0.5) card(ctx, cx, cy, 860, 640, ry, rx, s, questCard(ff), { t, hot: t > 3.0, alpha: a * (1 - smooth(9.8, 10.2, t)) });
      }
      if (t >= 6.6 && t < 10.2) {
        RIDERS.forEach((r, i) => {
          const k = easeOutExpo((t - 7.1 - i * 0.28) / 0.6) * (1 - smooth(9.85, 10.2, t));
          if (k > 0) riderRow(ctx, 90, 950 + i * 132 - (t - 7.1) * 18, r, k, ff);
        });
      }
      if (t >= 10.2 && t < 13.6) {
        POSTS.forEach((kind, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          const k = easeOutBack((t - 10.4 - i * 0.14) / 0.7);
          if (k <= 0) return;
          const cx = 300 + col * 480, cy = 720 + row * 385 - (t - 10.2) * 20;
          const ry = (col ? -0.22 : 0.22) * (1 - clamp(k, 0, 1)) + (col ? -0.06 : 0.06);
          card(ctx, cx, cy, 440, 380, ry, 0.15, 0.92 * clamp(k, 0, 1.2), postTile(ctx, kind, i, t, ff), { t: t + i, alpha: clamp(k, 0, 1) * (1 - smooth(13.3, 13.6, t)) });
        });
      }
      if (t >= 13.6) {
        const u = t - 13.6, k = easeOutBack(u / 0.8);
        // pedestal, product, price
        const py = 1300;
        ctx.save();
        const pg = ctx.createLinearGradient(W / 2 - 260, 0, W / 2 + 260, 0); pg.addColorStop(0, "#2a2c31"); pg.addColorStop(0.5, "#45484f"); pg.addColorStop(1, "#1a1b1f");
        ctx.fillStyle = pg; ctx.globalAlpha = clamp(k, 0, 1);
        ctx.beginPath(); ctx.ellipse(W / 2, py, 260, 60, 0, 0, TAU); ctx.fill();
        ctx.fillRect(W / 2 - 260, py, 520, 120);
        ctx.fillStyle = "#121316"; ctx.beginPath(); ctx.ellipse(W / 2, py + 120, 260, 60, 0, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = "rgba(206,255,0,0.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W / 2, py, 260, 60, 0, 0, TAU); ctx.stroke();
        const beam = ctx.createLinearGradient(0, 600, 0, py);
        beam.addColorStop(0, "rgba(206,255,0,0)"); beam.addColorStop(1, `rgba(206,255,0,${0.16 * clamp(k, 0, 1)})`);
        ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(W / 2 - 120, 600); ctx.lineTo(W / 2 + 120, 600); ctx.lineTo(W / 2 + 260, py); ctx.lineTo(W / 2 - 260, py); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.translate(W / 2, py - 190 - Math.sin(u * 2.2) * 14); ctx.rotate(Math.sin(u * 1.4) * 0.08); bottle(ctx, 0, 0, 1.25 * clamp(k, 0, 1.1)); ctx.restore();
        // price tag card
        const pk = easeOutExpo((u - 0.6) / 0.6);
        if (pk > 0) {
          card(ctx, W / 2 + 230, 900, 360, 170, -0.15, 0.1, pk, (c, w, h) => {
            font(c, 600, 24, ff); c.fillStyle = "rgba(244,244,240,0.6)"; c.fillText("YOUR BRAND · bottle", -w / 2 + 30, -h / 2 + 52);
            font(c, 900, 62, ff, "semi-expanded"); c.fillStyle = VOLT; c.fillText("400", -w / 2 + 28, -h / 2 + 128);
            font(c, 700, 28, ff); c.fillStyle = INK; c.fillText("embers", -w / 2 + 170, -h / 2 + 126);
          }, { t, hot: true });
        }
        const st = easeOutBack((u - 1.4) / 0.35);
        if (st > 0) {
          ctx.save(); ctx.translate(W / 2 - 220, 980); ctx.rotate(-0.18); ctx.scale(lerp(2, 1, clamp(st, 0, 1)), lerp(2, 1, clamp(st, 0, 1))); ctx.globalAlpha = clamp(st, 0, 1);
          ctx.strokeStyle = VOLT; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-150, -48, 300, 96, 14); ctx.stroke();
          font(ctx, 900, 50, ff, "expanded", 4); ctx.fillStyle = VOLT; ctx.textAlign = "center"; ctx.fillText("EARNED", 0, 18);
          ctx.restore();
        }
      }
      headline(ctx, t, sc, ff);
      if (t > 3.0) {
        ctx.save(); font(ctx, 700, 22, ff, "normal", 4); ctx.textAlign = "right"; ctx.fillStyle = "rgba(244,244,240,0.45)";
        ctx.globalAlpha = smooth(3.0, 3.4, t); ctx.fillText("ILLUSTRATIVE EXAMPLE", W - 90, 230); ctx.restore();
      }
      const out = smooth(15.9, 16.2, t);
      if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
    } else {
      endCard(ctx, t - 16.2, ff, { tagline: "Sponsor a quest.", sub: "Brand partnerships  —  DM us" });
    }
    finish(ctx, t, { vignette: 0.45 });
    ctx.restore();
  }
  window.Reel = { render, DUR, COVER: 5.2 };
})();
