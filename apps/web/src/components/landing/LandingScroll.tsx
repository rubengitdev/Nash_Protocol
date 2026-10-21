'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { setHoldOnScroll } from '../glyph/glyphEngine';

/**
 * Smooth (inertial) scrolling for the landing page only. The app pages keep native scroll, because their tables,
 * charts and dialogs scroll on their own. Lenis is skipped when the visitor asks for reduced motion.
 *
 * Elsewhere the glyph ribbons freeze while the page scrolls; here they keep moving, so the glide never shows a stalled
 * ribbon.
 */
export function LandingScroll() {
  useEffect(() => {
    setHoldOnScroll(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => setHoldOnScroll(true);
    const lenis = new Lenis({ anchors: true, lerp: 0.18, wheelMultiplier: 1 });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      setHoldOnScroll(true);
    };
  }, []);
  return null;
}
