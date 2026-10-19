import React from "react";
import { LandingHero } from "../components/landing/LandingSections";
import { LandingFeatures } from "../components/landing/LandingFeatures";
import { LandingHowItWorks } from "../components/landing/LandingHowItWorks";
import { LandingBanner } from "../components/landing/LandingBanner";
import { LandingScroll } from "../components/landing/LandingScroll";

// The landing page: hero, features (a ribbon driven by six cards), how it works, and the closing banner.
// Products, markets and the rest live on their own pages.
export default function HomePage() {
  return (
    <div className="w-full">
      <LandingScroll />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingBanner />
    </div>
  );
}
