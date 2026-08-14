"use client";

import "@/app/beyond-hero/beyond-hero.css";
import "@/app/story-concept/story-concept.css";
import { GridOverlay, Navbar, BeyondHero, BeyondMarquee } from "@/components/rinads";
import { StoryNarrative } from "@/components/story/StoryNarrative";

export function StoryConceptClient() {
  return (
    <div className="story-page">
      <GridOverlay />
      <Navbar />
      <main id="main">
        <BeyondHero />
        <BeyondMarquee />
        <StoryNarrative />
      </main>
    </div>
  );
}
