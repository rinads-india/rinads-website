"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AtSign,
  Camera,
  Circle,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/rinads/Logo";
import { DynamicIslandNav } from "@/components/rinads/DynamicIslandNav";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4";

const SERVICES = [
  "Website",
  "Mobile App",
  "Web App",
  "E-Commerce",
  "Visual Identity",
  "3D & Motion",
  "Digital Marketing",
  "Growth & Consulting",
  "Other",
] as const;

const NAV_LINKS = [
  { label: "Our story", href: "/story-concept" },
  { label: "Expertise", href: "/#services" },
  { label: "Our work", href: "/#work" },
  { label: "Journal", href: "/rinpo-story" },
] as const;

const INPUT_CLASS =
  "flex-1 min-w-0 text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition";

type SocialBtnProps = {
  icon: LucideIcon;
  label: string;
  className: string;
  href?: string;
};

function SocialBtn({ icon: Icon, label, className, href = "#" }: SocialBtnProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-opacity hover:opacity-80 ${className}`}
    >
      <Icon size={13} aria-hidden />
    </a>
  );
}

export function ProjectsLanding() {
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleService = (service: string) => {
    setSelected((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="projects-page min-h-screen bg-white p-3 sm:p-4 md:p-6">
      <div className="relative min-h-[calc(100vh-24px)] overflow-hidden rounded-2xl sm:min-h-[calc(100vh-32px)] sm:rounded-3xl md:min-h-[calc(100vh-48px)] lg:h-[calc(100vh-48px)]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        <div className="relative z-10 flex min-h-[calc(100vh-24px)] flex-col gap-6 p-4 sm:min-h-[calc(100vh-32px)] sm:p-6 md:min-h-[calc(100vh-48px)] md:p-8 lg:h-full">
          <DynamicIslandNav ariaLabel="Projects">
            <Link href="/" aria-label="RINADS home" className="flex shrink-0 items-center pl-1">
              <Logo className="h-7 w-auto sm:h-8" priority />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center gap-6 sm:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap text-sm font-medium text-[var(--island-foreground)] transition-opacity hover:opacity-60"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <a
              href="#project-form"
              className="ml-auto rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:px-5"
            >
              Start a project
            </a>
          </DynamicIslandNav>

          <div className="min-h-[3.5rem] sm:min-h-[4rem]" aria-hidden />

          <div className="min-h-[2rem] flex-1" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="shrink-0 text-3xl font-medium leading-tight text-white drop-shadow-lg sm:text-4xl lg:max-w-lg xl:max-w-2xl xl:text-5xl">
              We craft bold ideas
              <br />
              and ship them as{" "}
              <span className="projects-accent">products</span>
            </p>

            <div
              id="project-form"
              className="w-full shrink-0 lg:w-[min(480px,45%)]"
            >
              <div className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-2xl sm:rounded-3xl sm:p-6">
                {sent ? (
                  <SuccessState />
                ) : (
                  <ContactForm
                    name={name}
                    email={email}
                    message={message}
                    selected={selected}
                    sending={sending}
                    onNameChange={setName}
                    onEmailChange={setEmail}
                    onMessageChange={setMessage}
                    onToggleService={toggleService}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-xl">
        ✓
      </div>
      <h2 className="text-base font-semibold text-gray-900">You&apos;re all set!</h2>
      <p className="text-sm text-gray-500">Expect a reply within 24 hours.</p>
    </div>
  );
}

type ContactFormProps = {
  name: string;
  email: string;
  message: string;
  selected: string[];
  sending: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onToggleService: (service: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ContactForm({
  name,
  email,
  message,
  selected,
  sending,
  onNameChange,
  onEmailChange,
  onMessageChange,
  onToggleService,
  onSubmit,
}: ContactFormProps) {
  return (
    <>
      <h2 className="text-xl font-semibold tracking-tight text-black sm:text-2xl">
        Say hello! 👋
      </h2>

      <div className="flex flex-row items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Drop us a line</p>
          <a
            href="mailto:hello@rinads.com"
            className="truncate font-semibold text-blue-600 hover:underline"
          >
            hello@rinads.com
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <SocialBtn
            icon={AtSign}
            label="Twitter"
            className="bg-gray-100 text-gray-800"
          />
          <SocialBtn
            icon={Circle}
            label="Dribbble"
            className="bg-pink-100 text-pink-500"
          />
          <SocialBtn
            icon={Camera}
            label="Instagram"
            className="bg-orange-100 text-orange-400"
          />
          <SocialBtn
            icon={Link2}
            label="LinkedIn"
            className="bg-blue-100 text-blue-600"
          />
        </div>
      </div>

      <OrDivider />

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="text-sm font-medium text-black" htmlFor="project-vision">
          Tell us about your vision
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="project-name"
            type="text"
            name="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Full name"
            className={INPUT_CLASS}
            required
          />
          <input
            id="project-email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="Email"
            className={INPUT_CLASS}
            required
          />
        </div>

        <textarea
          id="project-vision"
          name="message"
          rows={4}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="What are you looking to build or improve..."
          className={`${INPUT_CLASS} resize-none`}
          required
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-black">
            I need help with...
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {SERVICES.map((service) => {
              const active = selected.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => onToggleService(service)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    active
                      ? "border-black bg-gray-100 text-black"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                  aria-pressed={active}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send my message"}
        </button>
      </form>
    </>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-sm font-medium text-gray-400">OR</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
