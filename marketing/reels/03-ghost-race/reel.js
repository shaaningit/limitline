// Reel 3, "Ghost race" (16 s). A 3D night city drawn as vectors: extruded buildings, a river,
// and a chase camera behind a glowing dot. You race a ghost of yourself from last month
// (your limit), catch it, pass it, and the ghost dissolves. Then the camera pulls up to show
// the whole loop. Numbers: limit 26:10, today 25:46, so 24 s faster = 24 / 1570 = +1.5%.
(function () {
  const { W, H, TAU, VOLT, INK, lerp, clamp, smooth, easeOut, easeInOut, rng, font, captions, finish, endCard } = window.LL;
  const DUR = 16;
  const CAPTIONS = [
    { a: 0.2, b: 2.6, words: "I raced *MYSELF* from last month." },
    { a: 2.8, b: 5.2, words: "Same route. Same legs." },
    { a: 5.35, b: 7.75, words: "The ghost is my old *LIMIT.*" },
    { a: 7.95, b: 9.9, words: "And I *PASSED* it." },
    { a: 10.15, b: 12.45, words: "Beat your old self. Get *REWARDED.*" },
  ];

  // ---------- The world ----------
  // A riverside running loop (Catmull-Rom through these points), in metres-ish units.
  const CTRL = [[-520, -620], [-80, -700], [380, -560], [600, -180], [560, 240], [700, 620], [380, 860], [-60, 760], [-380, 520], [-620, 120], [-700, -300]];
  const ROUTE = (() => {
    const pts = [], n = CTRL.length;
    for (let i = 0; i < n; i++) {
      const p0 = CTRL[(i - 1 + n) % n], p1 = CTRL[i], p2 = CTRL[(i + 1) % n], p3 = CTRL[(i + 2) % n];
      for (let k = 0; k < 40; k++) {
        const t = k / 40, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    pts.push(pts[0]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1] };
  })();
  function at(f) {
    f = ((f % 1) + 1) % 1;
    const d = f * ROUTE.len, c = ROUTE.cum;
    let lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c[mid] < d) lo = mid; else hi = mid; }
    const a = ROUTE.pts[lo], b = ROUTE.pts[hi], k = (d - c[lo]) / (c[hi] - c[lo] || 1);
    return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), hx: b[0] - a[0], hy: b[1] - a[1] };
  }
  const riverY = (x) => 80 + 0.35 * x + 90 * Math.sin(x / 300);
  function distToRoute(x, y) {
    let best = 1e9;
    for (let i = 0; i < ROUTE.pts.length; i += 3) best = Math.min(best, Math.hypot(ROUTE.pts[i][0] - x, ROUTE.pts[i][1] - y));
    return best;
  }
  const BUILDINGS = (() => {
    const r = rng(41), out = [];
    for (let gx = -1500; gx < 1500; gx += 120) {
      for (let gy = -1500; gy < 1500; gy += 120) {
        const parts = r() < 0.5 ? 1 : 2;
        for (let p = 0; p < parts; p++) {
          const w = parts === 1 ? 84 : 38, x0 = gx + 18 + p * 46, y0 = gy + 18, x1 = x0 + w, y1 = y0 + 84;
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
          if (Math.abs(cy - riverY(cx)) < 110) continue;
          if (distToRoute(cx, cy) < 75) continue;
          const tall = r(), h = 14 + Math.pow(tall, 2.2) * 150;
          out.push({ x0, y0, x1, y1, cx, cy, h, lit: r() < 0.08 });
        }
      }
    }
    return out;
  })();

  // ---------- Camera ----------
  const fy = (tau) => 0.048 + (0.7 * tau) / 9; // ghost
  const gapSec = (tau) => 12 - 27 * Math.pow(clamp(tau, 0, 9) / 9, 3.23); // + means the ghost leads
  const fyou = (tau) => fy(tau) - 0.004 * gapSec(tau);
  function camera(t) {
    const tau = clamp(t - 1.0, 0, 9);
    const p = at(fyou(tau) + 0.01), p2 = at(fyou(tau) + 0.04);
    let yaw = Math.atan2(p2.x - p.x, p2.y - p.y);
    const chase = { tx: p.x, ty: p.y, yaw, hc: 230, d: 430 };
    const intro = { tx: p.x, ty: p.y, yaw: yaw - 0.9, hc: 1500, d: 700 };
    const over = { tx: 40, ty: 40, yaw: 0.25, hc: 2650, d: 950 };
    let c;
    if (t < 2.6) c = mixCam(intro, chase, easeInOut(t / 2.6));
    else if (t < 10.0) c = chase;
    else c = mixCam(chase, over, easeInOut((t - 10.0) / 1.4));
    // a slow orbit around the overtake
    if (t > 7.4 && t < 10.0) c = { ...c, yaw: c.yaw + 0.35 * Math.sin(smooth(7.4, 9.6, t) * Math.PI) };
    return c;
  }
  function mixCam(a, b, k) {
    let dy = b.yaw - a.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU;
    return { tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k), yaw: a.yaw + dy * k, hc: lerp(a.hc, b.hc, k), d: lerp(a.d, b.d, k) };
  }
  function projector(c) {
    const cs = Math.cos(-c.yaw), sn = Math.sin(-c.yaw);
    const fl = Math.hypot(c.d, c.hc), f = [0, c.d / fl, -c.hc / fl], u = [0, c.hc / fl, c.d / fl];
    const focal = 1250;
    return (x, y, z = 0) => {
      const dx = x - c.tx, dy = y - c.ty;
      const rx = dx * cs - dy * sn, ry = dx * sn + dy * cs;
      const vx = rx, vy = ry + c.d, vz = z - c.hc;
      const depth = vy * f[1] + vz * f[2];
      if (depth < 20) return null;
      const yy = vy * u[1] + vz * u[2];
      return { x: W / 2 + (focal * vx) / depth, y: H * 0.5 - (focal * yy) / depth, z: depth, s: focal / depth };
    };
  }

  // ---------- Drawing ----------
  function polyline(ctx, P, pts) {
    let open = false;
    ctx.beginPath();
    for (const [x, y, z] of pts) {
      const q = P(x, y, z || 0);
      if (!q) { open = false; continue; }
      if (!open) { ctx.moveTo(q.x, q.y); open = true; } else ctx.lineTo(q.x, q.y);
    }
  }
  function ground(ctx, P) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#020304"); sky.addColorStop(0.5, "#07090c"); sky.addColorStop(1, "#0b0d10");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // streets
    ctx.strokeStyle = "rgba(255,255,255,0.075)"; ctx.lineWidth = 2;
    for (let g = -1500; g <= 1500; g += 120) {
      const a = [], b = [];
      for (let s = -1500; s <= 1500; s += 60) { a.push([g + 9, s]); b.push([s, g + 9]); }
      polyline(ctx, P, a); ctx.stroke(); polyline(ctx, P, b); ctx.stroke();
    }
    // river
    const top = [], bot = [];
    for (let x = -1600; x <= 1600; x += 40) { top.push([x, riverY(x) - 70]); bot.push([x, riverY(x) + 70]); }
    ctx.fillStyle = "#0a1a1f";
    ctx.beginPath(); let first = true;
    for (const [x, y] of [...top, ...bot.reverse()]) { const q = P(x, y); if (!q) continue; if (first) { ctx.moveTo(q.x, q.y); first = false; } else ctx.lineTo(q.x, q.y); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(120,200,220,0.14)"; ctx.lineWidth = 2;
    for (const off of [-30, 0, 30]) { polyline(ctx, P, top.map(([x]) => [x, riverY(x) + off])); ctx.stroke(); }
  }
  const SUN = [-0.5, -0.7];
  function buildings(ctx, P) {
    const list = [];
    for (const b of BUILDINGS) {
      const c = P(b.cx, b.cy, 0);
      if (!c || c.x < -400 || c.x > W + 400 || c.y < -600 || c.y > H + 300) continue;
      list.push({ b, z: c.z });
    }
    list.sort((a, b) => b.z - a.z);
    for (const { b } of list) {
      const corners = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]];
      const lo = corners.map(([x, y]) => P(x, y, 0)), hi = corners.map(([x, y]) => P(x, y, b.h));
      if (lo.some((q) => !q) || hi.some((q) => !q)) continue;
      // side faces, far ones first
      const faces = [0, 1, 2, 3].map((i) => { const j = (i + 1) % 4; return { i, j, z: (lo[i].z + lo[j].z) / 2 }; }).sort((a, b) => b.z - a.z);
      for (const { i, j } of faces) {
        const nx = corners[j][1] - corners[i][1], ny = -(corners[j][0] - corners[i][0]);
        const lit = clamp(0.5 + 0.5 * ((nx * SUN[0] + ny * SUN[1]) / Math.hypot(nx, ny)), 0, 1);
        const g = ctx.createLinearGradient(0, hi[i].y, 0, lo[i].y);
        const v = Math.round(16 + lit * 18);
        g.addColorStop(0, `rgb(${v + 4},${v + 6},${v + 10})`); g.addColorStop(1, `rgb(${v - 8},${v - 7},${v - 4})`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(lo[i].x, lo[i].y); ctx.lineTo(lo[j].x, lo[j].y); ctx.lineTo(hi[j].x, hi[j].y); ctx.lineTo(hi[i].x, hi[i].y); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = b.lit ? "#22271a" : "#23262c";
      ctx.beginPath(); hi.forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = b.lit ? "rgba(206,255,0,0.4)" : "rgba(255,255,255,0.09)"; ctx.lineWidth = b.lit ? 2 : 1.5; ctx.stroke();
    }
  }
  function trail(ctx, P, f0, f1, style) {
    if (f1 <= f0) return;
    const pts = [];
    const steps = Math.max(2, Math.ceil((f1 - f0) * 500));
    for (let k = 0; k <= steps; k++) { const p = at(lerp(f0, f1, k / steps)); pts.push([p.x, p.y, 2]); }
    ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (style === "you") {
      polyline(ctx, P, pts);
      ctx.strokeStyle = "rgba(206,255,0,0.25)"; ctx.lineWidth = 26; ctx.shadowColor = VOLT; ctx.shadowBlur = 30; ctx.stroke();
      ctx.strokeStyle = VOLT; ctx.lineWidth = 9; ctx.shadowBlur = 14; ctx.stroke();
      ctx.strokeStyle = "#f7ffd6"; ctx.lineWidth = 3; ctx.shadowBlur = 0; ctx.stroke();
    } else {
      polyline(ctx, P, pts);
      ctx.setLineDash([18, 16]); ctx.strokeStyle = `rgba(190,200,255,${style.a})`; ctx.lineWidth = 7; ctx.stroke();
    }
    ctx.restore();
  }
  function dot(ctx, P, f, t, kind, alpha) {
    const p = at(f), q = P(p.x, p.y, 8);
    if (!q || alpha <= 0) return null;
    const r = clamp(q.s * 16, 6, 40);
    ctx.save(); ctx.globalAlpha = alpha;
    if (kind === "you") {
      const ring = (t * 1.6) % 1;
      ctx.strokeStyle = `rgba(206,255,0,${0.6 * (1 - ring)})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(q.x, q.y, r * (1 + ring * 3), r * (1 + ring * 3) * 0.55, 0, 0, TAU); ctx.stroke();
      const g = ctx.createRadialGradient(q.x - r * 0.3, q.y - r * 0.3, 0, q.x, q.y, r);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, "#ecffa0"); g.addColorStop(1, VOLT);
      ctx.fillStyle = g; ctx.shadowColor = VOLT; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
    } else {
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 1.4);
      g.addColorStop(0, "rgba(225,230,255,0.9)"); g.addColorStop(0.6, "rgba(170,180,255,0.35)"); g.addColorStop(1, "rgba(170,180,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r * 1.4, 0, TAU); ctx.fill();
    }
    ctx.restore();
    return { ...q, r };
  }
  function pill(ctx, q, text, sub, hot, alpha, ff) {
    if (!q || alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    font(ctx, 800, 30, ff, "normal", 2);
    const w = Math.max(ctx.measureText(text).width, (font(ctx, 600, 22, ff), ctx.measureText(sub).width)) + 44;
    const x = clamp(q.x - w / 2, 30, W - 30 - w), y = q.y - q.r - 120;
    ctx.fillStyle = hot ? "rgba(206,255,0,0.95)" : "rgba(20,22,30,0.85)";
    ctx.strokeStyle = hot ? VOLT : "rgba(190,200,255,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, w, 84, 20); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(q.x, q.y - q.r - 8); ctx.lineTo(q.x, y + 84); ctx.stroke();
    ctx.fillStyle = hot ? "#0b0b0b" : INK; font(ctx, 800, 30, ff, "normal", 2); ctx.fillText(text, x + 22, y + 38);
    ctx.fillStyle = hot ? "rgba(11,11,11,0.7)" : "rgba(244,244,240,0.6)"; font(ctx, 600, 22, ff); ctx.fillText(sub, x + 22, y + 68);
    ctx.restore();
  }
  const motes = (() => { const r = rng(3); return Array.from({ length: 70 }, () => ({ a: r() * TAU, v: 40 + r() * 260, up: 120 + r() * 380, s: 2 + r() * 6 })); })();
  const TPASS = 8.0;
  function hud(ctx, t, ff) {
    const k = smooth(2.4, 2.9, t) * (1 - smooth(9.9, 10.3, t));
    if (k <= 0) return;
    const tau = clamp(t - 1.0, 0, 9), g = gapSec(tau);
    ctx.save(); ctx.globalAlpha = k;
    font(ctx, 700, 28, ff, "normal", 5); ctx.fillStyle = "rgba(244,244,240,0.6)";
    ctx.fillText("YOU  vs  YOU", 90, 230);
    const lead = g <= 0;
    const s = Math.abs(g), txt = `${lead ? "+" : "−"}0:${String(Math.round(s)).padStart(2, "0")}`;
    font(ctx, 900, 140, ff, "semi-expanded");
    ctx.fillStyle = lead ? VOLT : INK; if (lead) { ctx.shadowColor = VOLT; ctx.shadowBlur = 30; }
    ctx.fillText(txt, 84, 380); ctx.shadowBlur = 0;
    font(ctx, 700, 30, ff, "normal", 3); ctx.fillStyle = lead ? VOLT : "rgba(190,200,255,0.85)";
    ctx.fillText(lead ? "AHEAD OF LAST MONTH" : "BEHIND LAST MONTH", 90, 432);
    ctx.textAlign = "right"; font(ctx, 900, 72, ff, "semi-expanded"); ctx.fillStyle = INK;
    ctx.fillText((fyou(tau) * 5).toFixed(1), W - 150, 360);
    font(ctx, 700, 30, ff, "normal", 3); ctx.fillStyle = "rgba(244,244,240,0.6)"; ctx.fillText("KM", W - 90, 360);
    ctx.restore();
  }
  function stats(ctx, t, ff) {
    const k = easeOut((t - 10.6) / 0.5) * (1 - smooth(12.5, 12.7, t));
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * -60);
    ctx.fillStyle = "rgba(14,16,20,0.82)"; ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(90, 200, 900, 330, 36); ctx.fill(); ctx.stroke();
    font(ctx, 700, 28, ff, "normal", 4); ctx.fillStyle = "rgba(244,244,240,0.6)"; ctx.fillText("5 KM · RIVER LOOP", 140, 270);
    font(ctx, 900, 120, ff, "semi-expanded"); ctx.fillStyle = INK; ctx.fillText("25:46", 134, 400);
    font(ctx, 700, 34, ff); ctx.fillStyle = "rgba(190,200,255,0.85)"; ctx.fillText("last month 26:10", 140, 470);
    ctx.textAlign = "right"; font(ctx, 900, 96, ff, "semi-expanded"); ctx.fillStyle = VOLT; ctx.shadowColor = VOLT; ctx.shadowBlur = 24;
    ctx.fillText("+1.5%", 950, 400); ctx.shadowBlur = 0;
    font(ctx, 700, 30, ff); ctx.fillText("beyond your limit", 950, 470);
    ctx.restore();
  }

  function render(ctx, t, ff) {
    ctx.save();
    if (t < 13.0) {
      const c = camera(t), P = projector(c);
      ground(ctx, P);
      buildings(ctx, P);
      const tau = clamp(t - 1.0, 0, 9);
      // in the overview the rest of the loop fills in like a time-lapse
      const fill = smooth(10.4, 12.0, t);
      const yEnd = lerp(fyou(tau), 1.0, fill), gEnd = lerp(fy(tau), 0.985, fill);
      const passed = t > TPASS;
      const ghostA = passed ? 1 - smooth(TPASS + 0.2, TPASS + 0.9, t) : smooth(1.2, 2.0, t);
      trail(ctx, P, 0, gEnd, { a: 0.3 + (passed ? 0 : 0.25) });
      trail(ctx, P, 0, yEnd, "you");
      const gq = dot(ctx, P, fy(tau), t, "ghost", ghostA * (1 - fill));
      // the ghost breaks into motes once it is passed
      if (passed && t < TPASS + 1.6) {
        const p0 = at(fy(TPASS - 1.0)), q0 = P(p0.x, p0.y, 8);
        if (q0) {
          const u = t - TPASS - 0.2;
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          for (const m of motes) {
            if (u < 0) break;
            const life = clamp(1 - u / 1.3, 0, 1);
            ctx.globalAlpha = life; ctx.fillStyle = "rgba(200,210,255,1)";
            ctx.beginPath(); ctx.arc(q0.x + Math.cos(m.a) * m.v * u, q0.y + Math.sin(m.a) * m.v * u * 0.5 - m.up * u, m.s * life, 0, TAU); ctx.fill();
          }
          ctx.restore();
        }
      }
      const yq = dot(ctx, P, yEnd, t, "you", 1);
      const lab = smooth(2.5, 3.0, t) * (1 - smooth(9.9, 10.2, t));
      pill(ctx, gq, "YOU · LAST MONTH", "26:10 pace", false, lab * ghostA * (1 - smooth(TPASS - 0.1, TPASS + 0.15, t)), ff);
      pill(ctx, yq, "YOU · TODAY", passed ? "ahead" : "chasing", passed, lab, ff);
      // overtake flash
      const fl = Math.exp(-Math.max(0, t - TPASS) * 7) * (passed ? 1 : 0);
      if (fl > 0.01) { ctx.fillStyle = `rgba(206,255,0,${0.22 * fl})`; ctx.fillRect(0, 0, W, H); }
      hud(ctx, t, ff);
      stats(ctx, t, ff);
      captions(ctx, t, CAPTIONS, ff, { y: 1450 });
      const out = smooth(12.75, 13.0, t);
      if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
    } else {
      endCard(ctx, t - 13.0, ff);
    }
    finish(ctx, t);
    ctx.restore();
  }
  window.Reel = { render, DUR, COVER: 8.3, CAPTIONS };
})();
