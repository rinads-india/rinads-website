"use client";

const FOOTER_VIDEO =
  "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/bg1_jgni8n.mp4";

const LINKS = [
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative z-40 flex h-screen flex-col bg-brand-darkest"
    >
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        {/* Knockout text: video visible only inside letters */}
        <div className="relative w-full mix-blend-screen">
          <video
            autoPlay
            loop
            muted
            playsInline
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            src={FOOTER_VIDEO}
          />
          <a
            href="mailto:hello@outbox.studio"
            className="relative block bg-black mix-blend-multiply text-center text-[12vw] font-black leading-none tracking-tighter text-white transition-colors duration-500 hover:text-brand-orange"
          >
            LET&apos;S TALK.
          </a>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-12 lg:px-20 py-8 border-t border-white/10">
        <a href="#" className="text-xl font-black tracking-tight">
          <span className="text-white">OUT</span>
          <span className="text-white/70">BOX</span>
        </a>

        <nav className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition-colors hover:text-brand-orange"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-xs uppercase tracking-widest text-slate-400">
          © {new Date().getFullYear()} OUTBOX
        </p>
      </div>
    </footer>
  );
}
