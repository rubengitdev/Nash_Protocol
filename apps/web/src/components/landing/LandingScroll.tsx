'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Smooth (inertial) scrolling for the landing page only. The app pages keep native scroll, because their tables,
 * charts and dialogs scroll on their own. Lenis is skipped when the visitor asks for reduced motion.
 */
export function LandingScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ anchors: true, lerp: 0.18, wheelMultiplier: 1 });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);
  return null;
}
