'use client';

import React, { useEffect, useRef, useState } from 'react';

import { HowItWorksBoard } from './HowItWorksBoard';
import { useNetworkMode } from '../hooks/useNetworkMode';

const STEPS = [
  { label: 'Deposit', caption: 'Lock TSLA as collateral' },
  { label: 'Borrow or trade', caption: 'Borrow USDG, or go Long or Short' },
  { label: 'Auto-Protect', caption: 'Auto-Protect trims risk before liquidation' },
];
const STEP_MS = 9000;

export function HowItWorks() {
  const { isTestnet } = useNetworkMode();
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // The loop only runs while the section is on screen; re-entering resumes it.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0].isIntersecting;
        setInView(visible);
        if (visible) {
          setRevealed(true);
          setPaused(false);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || paused || reduceMotion) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [inView, paused, reduceMotion, step]);

  const goTo = (next: number, focus = false) => {
    setPaused(true);
    setTouched(true);
    setStep(next);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo((index + 1) % STEPS.length, true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo((index + STEPS.length - 1) % STEPS.length, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(STEPS.length - 1, true);
    }
  };

  const timed = inView && !paused && !reduceMotion;

  return (
    <section
      ref={sectionRef}
      className="hiw section-wrap"
      id="how-it-works"
      aria-labelledby="how-it-works-title"
    >
      <div className="section-topline">
        <span>§ 04 / THE MECHANICS</span>
        <span>HOW A POSITION WORKS</span>
      </div>
      <h2 className="section-title" id="how-it-works-title">
        Deposit. Borrow.{' '}
        <br className="hiw-br" />
        <span>Stay protected.</span>
      </h2>

      <div
        className={`hiw-stage${revealed ? ' is-playing' : ''}`}
        id="hiw-stage"
        role="tabpanel"
        aria-labelledby={`hiw-tab-${step}`}
      >
        <HowItWorksBoard step={step} active={inView} reduceMotion={reduceMotion} cycleMs={STEP_MS} />

        <p className="hiw-caption" key={step}>
          {STEPS[step].caption}
          {step === 2 && isTestnet && <span className="hiw-testnet">Testnet</span>}
        </p>

        <div
          className="hiw-tabs"
          role="tablist"
          aria-label="Steps"
          style={{ ['--hiw-step' as string]: `${STEP_MS}ms` }}
        >
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`hiw-tab-${i}`}
              aria-selected={step === i}
              aria-controls="hiw-stage"
              tabIndex={step === i ? 0 : -1}
              className={`hiw-tab${step === i ? ' is-active' : ''}${step === i && timed ? ' is-timed' : ''}`}
              onClick={() => goTo(i)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="sr-only" aria-live="polite">
          {touched ? STEPS[step].caption : ''}
        </span>
      </div>
    </section>
  );
}
