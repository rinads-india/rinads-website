const MARQUEE_TEXT =
  "SPARK \u00B7 RENDER \u00B7 IGNITE \u00B7 UNFOLD \u00B7 GENESIS \u00B7 EVOLVE \u00B7 RINPO \u00B7 RINADS \u00B7";

export function BeyondMarquee() {
  const copies = Array.from({ length: 4 }, (_, index) => index);

  return (
    <section aria-label="RINADS marquee" className="relative z-10 w-full overflow-hidden bg-white py-6 md:py-8">
      <div className="marquee-track flex whitespace-nowrap">
        {copies.map((copy) => (
          <span
            key={copy}
            className="beyond-display shrink-0 uppercase text-[clamp(2.5rem,6vw,5rem)]"
            style={{ color: "#9F4BC7", paddingRight: "0.25em" }}
          >
            {MARQUEE_TEXT}
          </span>
        ))}
      </div>
    </section>
  );
}
