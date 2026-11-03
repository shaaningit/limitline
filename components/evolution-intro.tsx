"use client";

import { useEffect, useRef } from "react";
import { mountEvolutionIntro } from "@/lib/intro/evolution";

// The opening graphic on the landing screen: human evolution of greatness, ending with an
// athlete breaking through the limit line. Tap to skip; tap again to replay.
export function EvolutionIntro() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const intro = mountEvolutionIntro(ref.current);
    return () => intro.destroy();
  }, []);
  return (
    <canvas
      ref={ref}
      className="intro"
      role="img"
      aria-label="Human evolution, from walking on all fours to an athlete breaking through their limit. Tap to replay."
    />
  );
}
