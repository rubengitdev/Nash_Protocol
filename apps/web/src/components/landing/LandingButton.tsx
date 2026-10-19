import React from 'react';
import Link from 'next/link';

interface LandingButtonProps {
  href: string;
  variant?: 'solid' | 'silver' | 'outline';
  children: string;
}

/**
 * The landing's button: a flat 2px block. The label never moves; hover and press show only the glass flare, the
 * click ripple and a colour change (see the interactive-surface rules in globals.css).
 */
export function LandingButton({ href, variant = 'solid', children }: LandingButtonProps) {
  const className = `landing-btn landing-btn-${variant}`;
  return (
    <Link href={href} className={className}>
      <span>{children}</span>
    </Link>
  );
}
