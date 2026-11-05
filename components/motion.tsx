"use client";

import { useEffect } from "react";

// The app's motion and depth layer (founder, Nov 5: "feel like Flutter, depth, touch").
// <Motion /> (in the athlete layout) sets --sy (scroll) and --hp (0 to 1 as the page title
// collapses) on <html> for the glass header and the parallax background, and stretches the page
// when you pull past the top. <Reveal /> (at the end of each page) works through class names:
//   .rv    springs into place when it scrolls into view (staggered)
//   .tilt  tilts in 3D toward your finger, with a light sheen
export function Motion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const main = document.querySelector<HTMLElement>("main.page");
    if (!main) return;

    // Scroll: collapsing title, glass header, parallax
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        root.style.setProperty("--sy", scrollY.toFixed(1));
        root.style.setProperty("--hp", Math.min(1, Math.max(0, scrollY / 64)).toFixed(3));
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Rubber band: pull past the top and the page stretches, then springs back.
    let y0: number | null = null;
    let pulled = 0;
    const start = (e: TouchEvent) => {
      y0 = scrollY <= 0 ? e.touches[0].clientY : null;
    };
    const move = (e: TouchEvent) => {
      if (y0 === null || reduced) return;
      const dy = e.touches[0].clientY - y0;
      if (dy <= 0) return;
      pulled = (dy / (1 + dy / 260)) * 0.55;
      main.style.transition = "none";
      main.style.transform = `translateY(${pulled}px)`;
    };
    const end = () => {
      if (!pulled) return;
      main.style.transition = "transform 0.55s cubic-bezier(0.34, 1.4, 0.5, 1)";
      main.style.transform = "";
      pulled = 0;
      y0 = null;
    };
    addEventListener("touchstart", start, { passive: true });
    addEventListener("touchmove", move, { passive: true });
    addEventListener("touchend", end, { passive: true });
    addEventListener("touchcancel", end, { passive: true });

    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("touchstart", start);
      removeEventListener("touchmove", move);
      removeEventListener("touchend", end);
      removeEventListener("touchcancel", end);
    };
  }, []);
  return null;
}

// Reveal and tilt. Rendered at the end of each page (inside the page's own loading boundary),
// so it only touches the page's elements after React has hydrated them.
export function Reveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const main = document.querySelector<HTMLElement>("main.page");
    if (!main) return;

    // Reveal
    const io = new IntersectionObserver(
      (list) => {
        for (const e of list) if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.08 },
    );
    const seen = new WeakSet<Element>();
    const attach = () => {
      let n = 0;
      main.querySelectorAll<HTMLElement>(".rv").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (reduced) return el.classList.add("in");
        const r = el.getBoundingClientRect();
        el.style.setProperty("--d", `${r.top < innerHeight ? Math.min(n++, 7) * 55 : 0}ms`);
        io.observe(el);
      });
      main.querySelectorAll<HTMLElement>(".tilt").forEach((el) => {
        if (el.dataset.tiltBound) return;
        el.dataset.tiltBound = "1";
        const max = Number(el.dataset.tilt || 6);
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.classList.add("live");
          el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
          el.style.setProperty("--ry", `${(px * max * 1.2).toFixed(2)}deg`);
          el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
          el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
          el.style.setProperty("--sheen", "1");
        };
        const leave = () => {
          el.classList.remove("live");
          el.style.setProperty("--rx", "0deg");
          el.style.setProperty("--ry", "0deg");
          el.style.setProperty("--sheen", "0");
        };
        if (!reduced) {
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
          el.addEventListener("pointerup", leave);
          el.addEventListener("pointercancel", leave);
        }
      });
    };
    attach();
    // Server actions and navigation swap content in place: pick up new elements as they arrive.
    const mo = new MutationObserver(attach);
    mo.observe(main, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
