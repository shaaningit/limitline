"use client";

import { useEffect, useRef } from "react";
import { mountStory } from "@/lib/intro/story";
import { Logo } from "./logo";

// The opening film (founder, Nov 5): six chapters you scroll through, ending on the way in.
// The canvas scene and the chapter text are both driven by the same scroll position.
const CHAPTERS = [
  { n: "I", t: "Fire", h: ["It began with", "a ", "spark."], p: "A million years ago we learned to keep a fire alive. Every ember you earn here starts the same way." },
  { n: "II", t: "Rise", h: ["Then we", "stood up.", ""], p: "Six million years, from all fours to upright. Each step a little further than the last." },
  { n: "III", t: "Endurance", h: ["Then we", "ran ", "far."], p: "Our bodies are built for distance. Few animals can outlast a human on foot." },
  { n: "IV", t: "Stillness", quote: "“What stands in the way becomes the way.”", cite: "Marcus Aurelius · Meditations", p: "Greatness is quiet. Show up, do the work, come back tomorrow." },
  { n: "V", t: "The line", h: ["Everyone has", "a ", "limit."], p: "Yours is nobody else's. LIMITLINE measures you against your own best, then rewards you for crossing it." },
];

export function LandingFilm({ children }: { children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = scroller.current;
    if (!root || !canvas.current) return;
    const chapters = [...root.querySelectorAll<HTMLElement>("[data-ch]")];
    const dots = [...root.querySelectorAll<HTMLElement>(".film-dots i")];
    const hint = root.querySelector<HTMLElement>(".film-hint");
    const logo = root.querySelector<HTMLElement>(".film-logo");
    const film = mountStory(root, canvas.current, {
      chapters: 6,
      onProgress(c) {
        chapters.forEach((el, i) => {
          const d = c - i;
          const a = Math.max(0, Math.min(1, 1 - Math.abs(d) * 1.7));
          el.style.opacity = a.toFixed(3);
          el.style.transform = `translateY(${(-d * 46).toFixed(1)}px)`;
          el.style.filter = a < 0.98 ? `blur(${((1 - a) * 6).toFixed(1)}px)` : "none";
          el.style.pointerEvents = a > 0.6 ? "auto" : "none";
          el.setAttribute("aria-hidden", a < 0.5 ? "true" : "false");
        });
        dots.forEach((dot, i) => dot.classList.toggle("on", i === Math.round(c)));
        if (hint) hint.style.opacity = String(Math.max(0, 1 - c * 4));
        if (logo) logo.style.opacity = String(Math.max(0, Math.min(1, (4.6 - c) * 2)));
      },
    });
    return () => film.destroy();
  }, []);

  const skip = () => {
    const root = scroller.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.scrollTo({ top: root.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="film" ref={scroller}>
      <div className="film-snap0" />
      <div className="film-stage">
        <canvas
          ref={canvas}
          role="img"
          aria-label="The evolution of greatness: fire, standing up, running, stillness on a summit, and crossing the limit line."
        />
        <div className="film-top">
          <span className="film-logo">
            <Logo size={18} />
          </span>
          <button className="film-skip" type="button" onClick={skip}>
            Skip
          </button>
        </div>
        <div className="film-dots" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <i key={i} />
          ))}
        </div>
        {CHAPTERS.map((c, i) => (
          <section key={c.n} className="chapter" data-ch={i} aria-label={`Chapter ${c.n}, ${c.t}`} style={{ opacity: i === 0 ? 1 : 0 }}>
            <div className="chapter-num">
              <span className="roman">{c.n}</span>
              <span className="chapter-rule" />
              <span className="eyebrow">{c.t}</span>
            </div>
            {c.quote ? (
              <>
                <blockquote>{c.quote}</blockquote>
                <cite>{c.cite}</cite>
              </>
            ) : (
              <h2>
                {c.h![0]}
                <br />
                {c.h![1]}
                {c.h![2] && <span className="volt">{c.h![2]}</span>}
              </h2>
            )}
            <p>{c.p}</p>
          </section>
        ))}
        <section className="chapter chapter-final" data-ch={5} aria-label="Chapter VI, You" style={{ opacity: 0 }}>
          <div className="chapter-brand">
            <div className="chapter-num" style={{ justifyContent: "center" }}>
              <span className="roman">VI</span>
              <span className="chapter-rule" />
              <span className="eyebrow">You</span>
            </div>
            <div className="wordmark">LIMITLINE</div>
            <p className="muted" style={{ margin: 0 }}>
              Cross your limit. Get rewarded.
            </p>
          </div>
          {children}
        </section>
        <div className="film-hint" aria-hidden="true">
          <span>Scroll</span>
          <span className="film-hint-line" />
        </div>
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="film-snap" />
      ))}
    </div>
  );
}
