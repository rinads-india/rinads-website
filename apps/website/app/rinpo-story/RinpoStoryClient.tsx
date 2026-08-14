"use client";

import "@/app/rinpo-story/rinpo-story.css";
import { GridOverlay, Navbar } from "@/components/rinads";
import { StoryNarrative } from "@/components/story/StoryNarrative";

export function RinpoStoryClient() {
  return (
    <div className="story-page">
      <GridOverlay />
      <Navbar />
      <main id="main">
        <StoryNarrative />
      </main>
    </div>
  );
}
