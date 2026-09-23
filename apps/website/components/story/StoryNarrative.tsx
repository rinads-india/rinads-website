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
    title: "Conversational Interface",
    body: "RINPO gives RINADS a recognizable way to ask questions, understand the platform, and continue into the right product experience.",
  },
  {
    no: "PWR / 02",
    title: "Business Context",
    body: "Inside connected products, RINPO can work with permitted business context and surface recommendations without bypassing product permissions.",
  },
  {
    no: "PWR / 03",
    title: "Voice",
    body: "Speech can become another input and output channel for the same RINPO experience. Browser voice is demonstrable today; production channels need supported integrations.",
  },
  {
    no: "PWR / 04",
    title: "Governed Action",
    body: "Where product tools exist, RINPO can move from explanation toward action through the permissions, confirmation, approval, runtime, and audit paths implemented by RINADS.",
  },
] as const;

export function StoryNarrative() {
  const { openPhoneScreen } = useRinpo();

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".story-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
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

      <header className="story-cinematic-hero relative flex h-screen min-h-[620px] flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/assets/story/hero-bg.webp"
            alt=""
            fill
            priority
            className="story-hero-img scale-105 object-cover object-[center_28%] transition-transform duration-[8s] ease-out"
          />
        </div>
        <div className="story-cinematic-veil absolute inset-0" />
        <div className="relative z-[2] max-w-[900px] px-[8vw] pb-[9vh]">
          <div className="story-kicker">RINPO · Brand lore · A fictional origin story</div>
          <h1 className="text-[clamp(5rem,16vw,13rem)] font-black leading-[0.88] tracking-tight">RINPO</h1>
          <p className="story-sub mt-5 max-w-[42rem] text-[clamp(1rem,1.5vw,1.25rem)] font-light leading-[1.75] text-white/70">
            A character created to give the RINADS platform a recognizable face and voice. The story below is
            <strong className="font-bold text-white"> fictional brand lore</strong>; product capabilities are described separately and are governed by what the platform actually implements.
          </p>
        </div>
        <div className="story-scrollcue">scroll to begin</div>
      </header>

      <section id="s-prologue" data-story-mood="none" className="story-prologue story-reveal px-[8vw] py-[18vh] text-center">
        <p className="mx-auto max-w-[44rem] text-[clamp(1.25rem,2.4vw,1.9rem)] font-light leading-[1.85] text-white/70">
          Imagine intelligence not as another dashboard, but as a character people can recognize.
          <br />
          <br />
          A guide that lives across the RINADS experience.
          <br />
          <br />
          His name is <strong className="font-bold text-white">RINPO</strong>.
        </p>
      </section>

      <section id="s-gift" data-story-mood="dusk" className="story-chapter story-reveal px-[8vw] py-[14vh]">
        <div className="chlabel">Chapter 01</div>
        <h2 className="story-ch-title">
          The <em>Gift</em>
        </h2>
        <div className="story-copy mt-8 max-w-[42rem] space-y-6 text-lg leading-[1.85] text-white/70">
          <p>
            In the story, where others saw <strong className="text-white">screens</strong>, RINPO saw{" "}
            <strong className="text-white">systems</strong>.
          </p>
          <p>
            Where others saw <strong className="text-white">tasks</strong>, he saw{" "}
            <strong className="text-white">connected workflows</strong>.
          </p>
          <p>
            Where others saw <strong className="text-white">AI</strong>, he asked a more useful question:
            <strong className="text-white"> what should happen next, and who should be allowed to do it?</strong>
          </p>
        </div>
      </section>

      <section id="s-tree" data-story-mood="awake" className="story-banyan story-reveal px-[8vw] py-[12vh] text-center">
        <div className="chlabel mx-auto justify-center">Chapter 02</div>
        <h2 className="story-ch-title text-center">
          The <em>Banyan Tree</em>
        </h2>
        <p className="story-copy mx-auto mt-8 max-w-[44rem] text-lg leading-[1.85] text-white/70">
          The banyan tree is the story&apos;s symbol for connected intelligence: many branches, one living system.
          <br />
          <br />
          RINADS uses the same metaphor in product form — multiple Operating Systems, one shared platform core.
        </p>
        <BanyanTreeSvg className="story-btree mx-auto mt-12 w-full max-w-[660px]" />
      </section>

      <section id="s-birth" data-story-mood="awake" className="story-birth story-reveal px-[8vw] py-[14vh] text-center">
        <div className="chlabel mx-auto justify-center">Chapter 03</div>
        <h2 className="story-ch-title text-center">
          The Birth of
          <br />
          the <em>Interface</em>
        </h2>
        <p className="story-copy mx-auto mt-8 max-w-[44rem] text-lg leading-[1.85] text-white/70">
          RINPO becomes the character layer of RINADS — a persistent interface for asking, understanding, recommending, and navigating toward supported actions.
          <br />
          <br />
          The character is fiction. The interface is product design.
        </p>
        <div className="relative mx-auto mt-10 w-full max-w-md">
          <Image
            src="/assets/rinpo-full-body-transparent-v2.png"
            alt="RINPO character"
            width={1024}
            height={1372}
            className="mx-auto h-auto w-full max-w-[min(320px,60vw)] object-contain object-bottom"
            sizes="(max-width: 768px) 60vw, 320px"
          />
        </div>
        <div className="story-specs mt-10 flex flex-wrap justify-center gap-2.5">
          {["RINADS CHARACTER IP", "PERSISTENT INTERFACE", "VOICE + CHAT", "PAGE-AWARE", "KERALA ORIGIN", "HUMAN APPROVAL"].map((tag) => (
            <span key={tag} className="story-spec-pill">{tag}</span>
          ))}
        </div>
      </section>

      <section id="s-powers" data-story-mood="awake" className="story-chapter story-reveal px-[8vw] py-[14vh]">
        <div className="chlabel">Chapter 04</div>
        <h2 className="story-ch-title">
          What RINPO
          <br />
          <em>represents</em>
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
          “The future is not more software to manage.
          <br />
          It is software that helps people <em className="text-[#C97DFF] not-italic">understand</em>,{" "}
          <em className="text-[#C97DFF] not-italic">decide</em>, and{" "}
          <em className="text-[#C97DFF] not-italic">operate</em> with greater clarity.”
        </blockquote>
        <cite className="mt-8 block text-[0.7rem] tracking-[0.22em] text-white/42 not-italic">
          — RINPO · RINADS BRAND PHILOSOPHY
        </cite>
      </section>

      <section id="s-dive" className="story-dive relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/story/dive-bg.webp" alt="" fill className="object-cover object-[center_30%]" />
        </div>
        <div className="story-dive-veil absolute inset-0" />
        <div className="story-reveal relative z-[2] max-w-[640px] px-[8vw]">
          <p className="story-mmark mb-6">From story to product</p>
          <h2 className="text-[clamp(2.6rem,6vw,4.6rem)] font-black leading-[1.04] tracking-tight">
            Meet the
            <br />
            <em className="story-dive-em not-italic text-[#C97DFF]">actual interface.</em>
          </h2>
          <p className="mb-9 mt-7 max-w-lg font-light leading-[1.8] text-white/70">
            The story gives RINPO identity. The product gives RINPO boundaries: page context, chat, browser voice, registered tools where implemented, permissions, approvals, and audit-aware workflows.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openPhoneScreen("chat")}
              className="rounded-full bg-[#9F4BC7] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8a3db3]"
            >
              Talk to RINPO
            </button>
            <Link
              href="/rinpo"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#9F4BC7] hover:text-[#C97DFF]"
            >
              RINPO product overview →
            </Link>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-[8vw] py-8 text-xs tracking-wide text-white/45">
        <span>© 2026 RINADS TECHNOLOGIES · RINPO IS RINADS CHARACTER IP</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/platform/rinads-intelligence" className="transition-colors hover:text-[#C97DFF]">
            RINADS Intelligence
          </Link>
          <Link href="/" className="transition-colors hover:text-white">
            WWW.RINADS.COM
          </Link>
        </div>
      </footer>
    </div>
  );
}
