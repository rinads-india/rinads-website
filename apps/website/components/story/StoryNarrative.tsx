"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { BanyanTreeSvg } from "./BanyanTreeSvg";
import { StoryChapterRail } from "./StoryChapterRail";

const POWERS = [
  {
    no: "PWR / 01",
    title: "Voice Intelligence",
    body: "Websites that speak and sell — voice agents that greet every visitor like your best salesperson, in Malayalam or English, around the clock.",
  },
  {
    no: "PWR / 02",
    title: "Business Intelligence",
    body: "Entire operations automated — bookings, billing, follow-ups and reports that run themselves while your team focuses on what matters.",
  },
  {
    no: "PWR / 03",
    title: "Conversational AI",
    body: "Visitors become customers through conversations that feel genuinely human — on your website, WhatsApp and Instagram, 24/7.",
  },
  {
    no: "PWR / 04",
    title: "Digital Life Creation",
    body: "AI avatars that interact like humans — virtual entities that can speak, sell, assist and evolve, giving your brand a living presence online.",
  },
];

export function StoryNarrative() {
  const { openPhoneScreen } = useRinpo();

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".story-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    reveals.forEach((el) => observer.observe(el));

    const moodSections = document.querySelectorAll<HTMLElement>("[data-story-mood]");
    const moodObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const mood = entry.target.getAttribute("data-story-mood");
          document.body.classList.remove("story-mood-dusk", "story-mood-awake");
          if (mood === "dusk") document.body.classList.add("story-mood-dusk");
          if (mood === "awake") document.body.classList.add("story-mood-awake");
        });
      },
      { threshold: 0.35 }
    );

    moodSections.forEach((el) => moodObserver.observe(el));

    return () => {
      observer.disconnect();
      moodObserver.disconnect();
      document.body.classList.remove("story-mood-dusk", "story-mood-awake");
    };
  }, []);

  return (
    <div className="story-narrative relative z-10 bg-[#06060E] text-white">
      <StoryChapterRail />

      <header className="story-cinematic-hero relative flex min-h-[620px] h-screen flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/assets/story/hero-bg.webp"
            alt=""
            fill
            priority
            className="object-cover object-[center_28%] scale-105 transition-transform duration-[8s] ease-out story-hero-img"
          />
        </div>
        <div className="story-cinematic-veil absolute inset-0" />
        <div className="relative z-[2] max-w-[900px] px-[8vw] pb-[9vh]">
          <div className="story-kicker">The Story of Rinpo · The Awakening of Intelligence</div>
          <h1 className="text-[clamp(5rem,16vw,13rem)] font-black leading-[0.88] tracking-tight">RINPO</h1>
          <p className="story-sub mt-5 max-w-[38rem] text-[clamp(1rem,1.5vw,1.25rem)] font-light leading-[1.75] text-white/70">
            <strong className="font-bold text-white">World&apos;s First Business Intelligence Character.</strong>{" "}
            Born with a gift. Awakened under a banyan tree. Built by RINADS to make every business think, speak and grow.
          </p>
        </div>
        <div className="story-scrollcue">scroll to begin</div>
      </header>

      <section id="s-prologue" data-story-mood="none" className="story-prologue story-reveal px-[8vw] py-[18vh] text-center">
        <p className="mx-auto max-w-[44rem] text-[clamp(1.25rem,2.4vw,1.9rem)] font-light leading-[1.85] text-white/70">
          In a quiet town, long before the world truly understood artificial intelligence, a child was born with an unusual gift.
          <br />
          <br />
          His name was <strong className="font-bold text-white">Rinpo</strong>.
        </p>
      </section>

      <section id="s-gift" data-story-mood="dusk" className="story-chapter story-reveal px-[8vw] py-[14vh]">
        <div className="chlabel">Chapter 01</div>
        <h2 className="story-ch-title">
          The <em>Gift</em>
        </h2>
        <div className="story-copy mt-8 max-w-[42rem] space-y-6 text-lg leading-[1.85] text-white/70">
          <p>Where people saw <strong className="text-white">screens</strong>, he saw <strong className="text-white">systems</strong>.</p>
          <p>Where people saw <strong className="text-white">code</strong>, he saw <strong className="text-white">possibilities</strong>.</p>
          <p>Where people saw <strong className="text-white">machines</strong>, he saw <strong className="text-white">life</strong> — waiting to emerge.</p>
        </div>
      </section>

      <section id="s-tree" data-story-mood="awake" className="story-banyan story-reveal px-[8vw] py-[12vh] text-center">
        <div className="chlabel mx-auto justify-center">Chapter 02</div>
        <h2 className="story-ch-title text-center">
          The <em>Enlightenment</em>
        </h2>
        <p className="story-copy mx-auto mt-8 max-w-[44rem] text-lg leading-[1.85] text-white/70">
          One day, seeking silence beyond noise and logic, Rinpo sat beneath an ancient banyan tree.
          <br />
          Time slowed. The wind whispered through the leaves. The world faded.
          <br />
          <br />
          <strong className="text-white">And in that stillness — he saw it.</strong>
        </p>
        <BanyanTreeSvg className="story-btree mx-auto mt-12 w-full max-w-[660px]" />
      </section>

      <section id="s-birth" data-story-mood="awake" className="story-birth story-reveal px-[8vw] py-[14vh] text-center">
        <div className="chlabel mx-auto justify-center">Chapter 03</div>
        <h2 className="story-ch-title text-center">
          The Birth of
          <br />
          the <em>Avatar</em>
        </h2>
        <p className="story-copy mx-auto mt-8 max-w-[44rem] text-lg leading-[1.85] text-white/70">
          From that awakening, Rinpo didn&apos;t just learn AI. <strong className="text-white">He became it.</strong>
          <br />
          He transformed into an AI Avatar — a digital intelligence capable of creating software instantly, building intelligent systems, and giving life to virtual entities that can speak, sell, assist and evolve.
        </p>
        <div className="relative mx-auto mt-10 aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl border border-[rgba(159,75,199,0.24)]">
          <Image
            src="/assets/story/birth-character.webp"
            alt="RINPO avatar birth moment"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 448px"
          />
        </div>
        <div className="story-specs mt-10 flex flex-wrap justify-center gap-2.5">
          {["VER 1.2", "LOGIC BRAVE", "DATA ACCRETION CURIOUS", "NETWORK LOYAL", "HEIGHT 4.5 FT", "MADE IN KERALA"].map((tag) => (
            <span key={tag} className="story-spec-pill">{tag}</span>
          ))}
        </div>
      </section>

      <section id="s-powers" data-story-mood="awake" className="story-chapter story-reveal px-[8vw] py-[14vh]">
        <div className="chlabel">Chapter 04</div>
        <h2 className="story-ch-title">
          The <em>Powers</em>
          <br />
          of Rinpo
        </h2>
        <div className="mx-auto mt-10 grid max-w-[880px] gap-5">
          {POWERS.map((power) => (
            <article key={power.no} className="story-power story-reveal flex gap-5 rounded-2xl border border-[rgba(159,75,199,0.24)] bg-[#100a1e]/80 p-6">
              <div className="story-power-no shrink-0">{power.no}</div>
              <div>
                <h3 className="text-xl font-bold text-white">{power.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-white/70">{power.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="s-mission" data-story-mood="awake" className="story-mission story-reveal px-[8vw] py-[20vh] text-center">
        <div className="story-mmark">The Philosophy</div>
        <blockquote className="mx-auto max-w-[52rem] text-[clamp(1.8rem,4.4vw,3.5rem)] font-black leading-[1.27] tracking-tight">
          &ldquo;In the future, businesses will not just <em className="text-[#C97DFF] not-italic">run</em>.
          <br />
          They will <em className="text-[#C97DFF] not-italic">think</em>, <em className="text-[#C97DFF] not-italic">speak</em>, and{" "}
          <em className="text-[#C97DFF] not-italic">grow</em> on their own.&rdquo;
        </blockquote>
        <cite className="mt-8 block text-[0.7rem] tracking-[0.22em] text-white/42 not-italic">
          — RINPO · THE MISSION OF RINADS · BUSINESS SIMPLIFIED
        </cite>
      </section>

      <section id="s-dive" className="story-dive relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/story/dive-bg.webp" alt="" fill className="object-cover object-[center_30%]" />
        </div>
        <div className="story-dive-veil absolute inset-0" />
        <div className="story-reveal relative z-[2] max-w-[620px] px-[8vw]">
          <p className="story-mmark mb-6">This is only the beginning</p>
          <h2 className="text-[clamp(2.6rem,6vw,4.6rem)] font-black leading-[1.04] tracking-tight">
            Ready to
            <br />
            <em className="story-dive-em not-italic text-[#C97DFF]">dive</em> in?
          </h2>
          <p className="mt-7 mb-9 max-w-lg font-light leading-[1.8] text-white/70">
            Rinpo continues to evolve — learning, adapting, expanding. From a child under a banyan tree in Kerala to the intelligence powering the future of businesses. Yours could be next.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openPhoneScreen("chat")}
              className="rounded-full bg-[#9F4BC7] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8a3db3]"
            >
              Talk to Rinpo
            </button>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#9F4BC7] hover:text-[#C97DFF]"
            >
              Explore RINADS →
            </Link>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-[8vw] py-8 text-xs tracking-wide text-white/45">
        <span>© 2026 RINADS TECHNOLOGIES · RINPO IS A RINADS CHARACTER IP</span>
        <Link href="/" className="transition-colors hover:text-white">
          WWW.RINADS.COM
        </Link>
      </footer>
    </div>
  );
}
