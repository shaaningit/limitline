// Reel 8, "A badge vs real gear" (16 s). The first waitlist reel: problem, then solution.
// A 3D odometer counts a year of training up to 1,000 km, and all it earns is a tiny badge on
// a pedestal under a spotlight. Then LIMITLINE: do a quest, post it, embers fly, and real gear
// drops onto the pedestal in the badge's place. Ends on the Sprint mark and "Join the waitlist".
(function () {
  const { W, H, TAU, VOLT, INK, lerp, clamp, smooth, easeOutExpo, easeOutBack, easeInOut, rng, font, captions, finish, endCard } = window.LL;
  const DUR = 16;
  const FF = "Archivo, Inter, sans-serif";
  const CAPTIONS = [
    { a: 0.3, b: 3.0, words: "You ran *1,000 KM* this year." },
    { a: 3.2, b: 5.45, words: "And all you got was... a *BADGE.*" },
    { a: 5.75, b: 8.45, words: "On LIMITLINE you do a *QUEST* and post it." },
    { a: 8.65, b: 12.2, words: "You earn *REAL GEAR.* Not badges." },
  ];
  const PX = W / 2, PY = 1180; // pedestal top centre

  // ---------- Studio ----------
  function studio(ctx, t, warm) {
    ctx.fillStyle = "#060606"; ctx.fillRect(0, 0, W, H);
    const c = warm ? "206,255,0" : "255,255,255";
    const cone = ctx.createLinearGradient(0, 0, 0, PY);
    cone.addColorStop(0, `rgba(${c},0)`); cone.addColorStop(1, `rgba(${c},${warm ? 0.1 : 0.07})`);
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(PX - 70, -20); ctx.lineTo(PX + 70, -20); ctx.lineTo(PX + 360, PY); ctx.lineTo(PX - 360, PY); ctx.fill();
    const floor = ctx.createRadialGradient(PX, PY + 220, 0, PX, PY + 220, 700);
    floor.addColorStop(0, `rgba(${c},${warm ? 0.1 : 0.05})`); floor.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = floor; ctx.fillRect(0, PY - 100, W, 900);
  }
  function pedestal(ctx, k) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(k, 0, 1); ctx.translate(0, (1 - clamp(k, 0, 1)) * 200);
    const r = 230, h = 150;
    const side = ctx.createLinearGradient(PX - r, 0, PX + r, 0);
    side.addColorStop(0, "#111214"); side.addColorStop(0.35, "#3a3c42"); side.addColorStop(0.6, "#25272b"); side.addColorStop(1, "#0d0e10");
    ctx.fillStyle = side; ctx.fillRect(PX - r, PY, r * 2, h);
    ctx.beginPath(); ctx.ellipse(PX, PY + h, r, 46, 0, 0, Math.PI); ctx.fill();
    const top = ctx.createLinearGradient(0, PY - 46, 0, PY + 46);
    top.addColorStop(0, "#4a4d54"); top.addColorStop(1, "#24262a");
    ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(PX, PY, r, 46, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function shadow(ctx, x, y, w, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, w);
    g.addColorStop(0, `rgba(0,0,0,${0.55 * a})`); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.22); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w, 0, TAU); ctx.fill(); ctx.restore();
  }

  // ---------- Scene 1: the odometer ----------
  function drum(ctx, x, y, w, h, value) {
    // one rolling digit; value is continuous (e.g. 3.4 shows 3 rolling into 4)
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "#0a0a0a"); g.addColorStop(0.18, "#2a2b2f"); g.addColorStop(0.5, "#3b3d43"); g.addColorStop(0.82, "#2a2b2f"); g.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.clip();
    const d = Math.floor(value), f = value - d;
    font(ctx, 900, h * 0.7, FF, "semi-condensed"); ctx.textAlign = "center"; ctx.fillStyle = INK;
    for (const [n, off] of [[d % 10, -f], [(d + 1) % 10, 1 - f]]) {
      const yy = y + h * 0.75 + off * h * 0.92;
      ctx.save(); ctx.globalAlpha *= 1 - Math.min(1, Math.abs(off) * 1.4);
      ctx.fillText(String(n), x + w / 2, yy); ctx.restore();
    }
    // cylinder shading over the digits
    const sh = ctx.createLinearGradient(0, y, 0, y + h);
    sh.addColorStop(0, "rgba(0,0,0,0.75)"); sh.addColorStop(0.3, "rgba(0,0,0,0)"); sh.addColorStop(0.7, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.stroke();
  }
  function odometer(ctx, t) {
    const km = 1000 * easeInOut(clamp((t - 0.3) / 2.3, 0, 1));
    const k = easeOutExpo(t / 0.5), out = easeInOut((t - 3.0) / 0.45);
    ctx.save(); ctx.globalAlpha = k * (1 - out); ctx.translate(0, -out * 320);
    font(ctx, 700, 30, FF, "normal", 6); ctx.textAlign = "center"; ctx.fillStyle = "rgba(244,244,240,0.6)";
    ctx.fillText("THIS YEAR YOU RAN", W / 2, 470);
    const w = 160, h = 230, gap = 16, x0 = W / 2 - (4 * w + 3 * gap + 40) / 2;
    const vals = [km / 1000, km / 100, km / 10, km];
    vals.forEach((v, i) => {
      const x = x0 + i * (w + gap) + (i > 0 ? 40 : 0);
      // each wheel only turns when the one to its right rolls over, like a real odometer
      drum(ctx, x, 520, w, h, i < 3 ? Math.floor(v) + Math.max(0, (vals[i + 1] % 10) - 9) : v);
    });
    // comma between thousands and hundreds
    font(ctx, 900, 150, FF); ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.fillText(",", x0 + w + gap / 2 + 20, 520 + h - 20);
    font(ctx, 900, 64, FF, "expanded", 6); ctx.fillStyle = VOLT; ctx.shadowColor = "rgba(206,255,0,0.5)"; ctx.shadowBlur = 24;
    ctx.fillText("KM", W / 2, 860); ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ---------- Scene 2: the badge ----------
  function badge(ctx, x, y, s, rot, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const hex = (r) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i * TAU) / 6; if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); };
    const g = ctx.createLinearGradient(-50, -50, 50, 50); g.addColorStop(0, "#e8e8e4"); g.addColorStop(0.5, "#8d8d88"); g.addColorStop(1, "#4a4a46");
    hex(52); ctx.fillStyle = g; ctx.fill();
    hex(40); ctx.fillStyle = "#2b2b2b"; ctx.fill();
    font(ctx, 900, 22, FF); ctx.textAlign = "center"; ctx.fillStyle = "#d9d9d4"; ctx.fillText("1000", 0, 2); font(ctx, 700, 12, FF, "normal", 2); ctx.fillText("KM", 0, 18);
    ctx.restore();
  }

  // ---------- Scene 3: the quest ----------
  function chip(ctx, y, k, label, sub, tick) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(k, 0, 1); ctx.translate((1 - clamp(k, 0, 1)) * -700, 0);
    ctx.fillStyle = "rgba(20,21,24,0.94)"; ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(120, y, W - 240, 132, 34); ctx.fill(); ctx.stroke();
    font(ctx, 800, 50, FF); ctx.fillStyle = INK; ctx.fillText(label, 170, y + 70);
    font(ctx, 600, 28, FF); ctx.fillStyle = "rgba(244,244,240,0.55)"; ctx.fillText(sub, 172, y + 110);
    const tk = easeOutBack((tick) / 0.3);
    if (tk > 0) {
      ctx.save(); ctx.translate(W - 200, y + 66); ctx.scale(clamp(tk, 0, 1.2), clamp(tk, 0, 1.2));
      ctx.fillStyle = VOLT; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#0b0b0b"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-3, 12); ctx.lineTo(16, -12); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  function gem(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.shadowColor = VOLT; ctx.shadowBlur = 20;
    ctx.fillStyle = "#b6e600"; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(32, -6); ctx.lineTo(0, 44); ctx.lineTo(-32, -6); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f2ffc2"; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(-32, -6); ctx.lineTo(-8, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#7a9900"; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(32, -6); ctx.lineTo(0, 44); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------- Scene 4: real gear ----------
  function shoe(ctx, s) {
    ctx.save(); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-130, -70, 130, 40); g.addColorStop(0, "#f3ffd1"); g.addColorStop(0.45, VOLT); g.addColorStop(1, "#5e7600");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-130, 20); ctx.lineTo(-112, -62); ctx.quadraticCurveTo(-70, -70, -40, -50); ctx.lineTo(10, -12); ctx.lineTo(110, 0); ctx.quadraticCurveTo(142, 10, 136, 36); ctx.lineTo(-130, 36); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f4f4f0"; ctx.beginPath(); ctx.roundRect(-134, 30, 274, 22, 10); ctx.fill();
    ctx.strokeStyle = "rgba(11,11,11,0.55)"; ctx.lineWidth = 5; ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-50 + i * 16, -42 + i * 8); ctx.lineTo(-30 + i * 16, -30 + i * 8); ctx.stroke(); }
    ctx.restore();
  }
  function bottle(ctx, s) {
    ctx.save(); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-50, 0, 50, 0); g.addColorStop(0, "#f4f4f0"); g.addColorStop(0.45, "#a3a29b"); g.addColorStop(1, "#3f3e3a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-48, -110, 96, 220, 30); ctx.fill();
    ctx.fillStyle = VOLT; ctx.fillRect(-48, -14, 96, 38);
    ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.roundRect(-24, -146, 48, 40, 10); ctx.fill();
    ctx.restore();
  }
  function socks(ctx, s) {
    ctx.save(); ctx.scale(s, s);
    for (const [dx, rot] of [[-30, -0.12], [30, 0.1]]) {
      ctx.save(); ctx.translate(dx, 0); ctx.rotate(rot);
      const g = ctx.createLinearGradient(-40, -100, 60, 100); g.addColorStop(0, "#f4f4f0"); g.addColorStop(1, "#7f7e78");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-34, -100); ctx.lineTo(28, -100); ctx.lineTo(28, 18); ctx.quadraticCurveTo(30, 46, 64, 58); ctx.quadraticCurveTo(94, 72, 78, 98); ctx.lineTo(-10, 90); ctx.quadraticCurveTo(-38, 82, -36, 36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = VOLT; ctx.fillRect(-34, -100, 62, 22);
      ctx.restore();
    }
    ctx.restore();
  }
  function cap(ctx, s) {
    ctx.save(); ctx.scale(s, s);
    const g = ctx.createLinearGradient(-80, -70, 80, 30); g.addColorStop(0, "#55585f"); g.addColorStop(1, "#141518");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 10, 80, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#1c1d21"; ctx.beginPath(); ctx.ellipse(72, 12, 72, 16, 0.05, 0, TAU); ctx.fill();
    window.LL.sprintMark(ctx, 0, -32, 54, 1, "#2a2c31");
    ctx.restore();
  }
  const GEAR = [
    { draw: shoe, x: 0, y: -84, s: 1.25, at: 9.0, rot: -0.06 },
    { draw: bottle, x: -170, y: -150, s: 0.85, at: 9.25, rot: 0.04 },
    { draw: socks, x: 175, y: -120, s: 0.85, at: 9.5, rot: 0.05 },
    { draw: cap, x: 30, y: -250, s: 0.9, at: 9.75, rot: -0.08 },
  ];
  const burst = (() => { const r = rng(88); return Array.from({ length: 22 }, () => ({ a: -Math.PI / 2 + (r() - 0.5) * 2.6, v: 500 + r() * 700, s: 0.5 + r() * 0.5, rot: r() * TAU })); })();

  function render(ctx, t, ff) {
    ctx.save();
    if (t < 12.4) {
      const warm = t > 5.6;
      studio(ctx, t, warm);
      // the pedestal rises under the badge, and stays for the gear
      pedestal(ctx, easeOutExpo((t - 2.9) / 0.6));
      if (t < 3.5) odometer(ctx, t);

      // the badge drops, bounces, and sits there looking small; later it's knocked away
      if (t > 3.0 && t < 9.4) {
        const drop = clamp((t - 3.1) / 0.55, 0, 1);
        const bounce = drop < 1 ? -620 * Math.pow(1 - drop, 2) : -Math.abs(Math.sin((t - 3.65) * 9)) * 30 * Math.exp(-(t - 3.65) * 5);
        const gone = easeInOut((t - 8.95) / 0.4);
        const bx = PX + gone * 700, by = PY - 60 + bounce - gone * 300;
        shadow(ctx, PX, PY, 70 * (1 - gone), drop);
        badge(ctx, bx, by, 1.15, gone * 3, 1 - gone * 0.3);
      }
      // the turn: quest, post, embers
      if (t > 5.6 && t < 9.0) {
        const out = smooth(8.6, 9.0, t);
        ctx.save(); ctx.globalAlpha = 1 - out;
        chip(ctx, 340, easeOutExpo((t - 5.75) / 0.5), "Run 10 km", "Quest · checked with Strava", t - 6.3);
        chip(ctx, 500, easeOutExpo((t - 6.55) / 0.5), "Post it", "Instagram · embers ×2", t - 7.1);
        ctx.restore();
        // embers fly from the chips down into the pedestal
        for (let i = 0; i < 10; i++) {
          const q = clamp((t - 7.4 - i * 0.07) / 0.8, 0, 1);
          if (q <= 0 || q >= 1) continue;
          const sx = W - 200, sy = 566;
          const x = lerp(sx, PX + (i - 5) * 18, easeInOut(q)), y = lerp(sy, PY - 40, easeInOut(q)) - Math.sin(q * Math.PI) * 220;
          gem(ctx, x, y, 0.7, q * 6 + i);
        }
        // embers counter
        const ek = easeOutBack((t - 7.5) / 0.4) * (1 - out);
        if (ek > 0) {
          ctx.save(); ctx.globalAlpha = clamp(ek, 0, 1); ctx.textAlign = "center";
          font(ctx, 900, 110, ff, "semi-expanded"); ctx.fillStyle = VOLT; ctx.shadowColor = "rgba(206,255,0,0.5)"; ctx.shadowBlur = 30;
          ctx.fillText(`+${Math.round(20 * clamp((t - 7.5) / 0.9, 0, 1))}`, W / 2, 790); ctx.shadowBlur = 0;
          font(ctx, 700, 32, ff, "normal", 6); ctx.fillStyle = "rgba(244,244,240,0.65)"; ctx.fillText("EMBERS", W / 2, 840);
          ctx.restore();
        }
      }
      // the gear lands on the pedestal
      for (const gItem of GEAR) {
        const q = clamp((t - gItem.at) / 0.5, 0, 1);
        if (q <= 0) continue;
        const land = q < 1 ? -900 * Math.pow(1 - q, 2) : -Math.abs(Math.sin((t - gItem.at - 0.5) * 10)) * 18 * Math.exp(-(t - gItem.at - 0.5) * 6);
        shadow(ctx, PX + gItem.x, PY, 110 * gItem.s, q);
        ctx.save(); ctx.translate(PX + gItem.x, PY + gItem.y + land + Math.sin(t * 2 + gItem.x) * 4); ctx.rotate(gItem.rot);
        gItem.draw(ctx, gItem.s); ctx.restore();
      }
      // ember burst when the gear arrives
      if (t > 9.0 && t < 10.6) {
        const u = t - 9.0;
        for (const b of burst) gem(ctx, PX + Math.cos(b.a) * b.v * u, PY - 100 + Math.sin(b.a) * b.v * u + 900 * u * u, b.s * 0.6, b.rot + u * 5);
      }
      // volt flash on the turn
      const fl = Math.exp(-Math.max(0, t - 5.6) * 7) * (t >= 5.6 ? 1 : 0);
      if (fl > 0.01) { ctx.fillStyle = `rgba(206,255,0,${0.25 * fl})`; ctx.fillRect(0, 0, W, H); }
      captions(ctx, t, CAPTIONS, ff, { y: 1520, size: 76, gap: 0.14 });
      const out = smooth(12.15, 12.4, t);
      if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
    } else {
      endCard(ctx, t - 12.4, ff, { sprint: true, tagline: ["Train. Post.", "Get rewarded."], cta: "JOIN THE WAITLIST" });
    }
    finish(ctx, t);
    ctx.restore();
  }
  window.Reel = { render, DUR, COVER: 4.3, CAPTIONS };
})();
