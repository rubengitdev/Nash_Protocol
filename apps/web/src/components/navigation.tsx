import React from 'react';

// The landing header carries no page links; the app header shows every area.
export const APP_NAV_LINKS = [
    { name: 'Markets', href: '/markets' },
    { name: 'China Equities', href: '/markets/china' },
    { name: 'Pons', href: '/markets/pons' },
    { name: 'Lending', href: '/lending' },
    { name: 'Trade', href: '/trade' },
    { name: 'Earn', href: '/earn' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Analytics', href: '/analytics' },
];

/** The silver N mark on a black tile: the mark is only ever placed on black (docs/BRAND.md). */
export function BrandMark({ size = 36 }: { size?: number }) {
    return (
        <span className="brand-tile" style={{ width: size, height: size }}>
            <img src="/brand/nash-mark-160.png" alt="" width={size} height={size} />
        </span>
    );
}
