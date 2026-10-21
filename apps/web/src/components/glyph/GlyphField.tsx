'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { GLYPH_COLORS, type GlyphPreset } from './glyphPresets';
import { registerField, renderStill } from './glyphEngine';

interface GlyphFieldProps {
  preset: GlyphPreset;
  /** Silhouette height to grow from on first paint (the hero). */
  morphFromHeight?: number;
  /** Rows near the pointer widen. Off for tiles, which do not react. */
  interactive?: boolean;
  /** Change this value to collapse the shape to a stub and regrow it as the (new) preset. */
  morphKey?: string | number;
  /**
   * Paint a single still frame and animate only while the nearest card (.fx-card, or any [data-glyph-host]) is hovered
   * or has focus. For the small emblems on cards, which cost nothing until the visitor reaches for them.
   */
  liveOnHover?: boolean;
  className?: string;
}

/**
 * A canvas filled by the shared glyph renderer (glyphEngine.ts). Decorative: hidden from assistive tech, and drawn
 * only while it is on screen. Without WebGL2 it stays empty and the page keeps its plain surface colour.
 */
export function GlyphField({ preset, morphFromHeight, interactive = true, morphKey, liveOnHover = false, className = '' }: GlyphFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const handleRef = useRef<ReturnType<typeof registerField>>(null);
  const firstKey = useRef(morphKey);

  // The render loop reads the preset on every frame, so a new one needs no re-registration.
  const presetRef = useRef(preset);
  presetRef.current = preset;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = registerField({
      canvas,
      getPreset: () => presetRef.current,
      // Read the theme from the page itself: the head script sets it before first paint, ahead of React state.
      getColors: () => GLYPH_COLORS[document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'],
      morphFromHeight,
      interactive,
      live: !liveOnHover,
    });
    handleRef.current = handle;
    if (!handle) return;

    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => handle.setOnScreen(entries[0]?.isIntersecting ?? false), { threshold: 0 })
        : null;
    observer?.observe(canvas);
    const rect = canvas.getBoundingClientRect();
    handle.setOnScreen(rect.bottom > 0 && rect.top < window.innerHeight);

    // A still frame (reduced motion, or an emblem at rest) does not redraw by itself, so a resize has to.
    const resizer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => handle.invalidate()) : null;
    resizer?.observe(canvas);

    const frame = requestAnimationFrame(() => {
      if (fadeRef.current) fadeRef.current.style.opacity = '1';
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resizer?.disconnect();
      handle.unregister();
      handleRef.current = null;
    };
  }, [morphFromHeight, interactive, liveOnHover]);

  // An emblem wakes while its card is hovered or focused, and goes back to a still when the visitor leaves.
  useEffect(() => {
    if (!liveOnHover) return;
    const host = canvasRef.current?.closest('[data-glyph-host], .fx-card');
    if (!host) return;
    const wake = () => handleRef.current?.setLive(true);
    const rest = () => handleRef.current?.setLive(false);
    host.addEventListener('pointerenter', wake);
    host.addEventListener('pointerleave', rest);
    host.addEventListener('focusin', wake);
    host.addEventListener('focusout', rest);
    return () => {
      host.removeEventListener('pointerenter', wake);
      host.removeEventListener('pointerleave', rest);
      host.removeEventListener('focusin', wake);
      host.removeEventListener('focusout', rest);
    };
  }, [liveOnHover]);

  // A new key means a new figure: shrink the old one and grow the next. The first key is the initial state.
  useEffect(() => {
    if (firstKey.current === morphKey) return;
    firstKey.current = morphKey;
    handleRef.current?.swap();
  }, [morphKey]);

  // Redraw straight away after a theme switch, even if the loop is idle.
  useEffect(() => {
    renderStill();
  }, [theme]);

  return (
    <div className={`h-full w-full ${className}`} aria-hidden="true">
      <div ref={fadeRef} className="h-full w-full" style={{ opacity: 0, transition: 'opacity .4s ease-in-out' }}>
        <canvas ref={canvasRef} className="pointer-events-none block h-full w-full" />
      </div>
    </div>
  );
}
