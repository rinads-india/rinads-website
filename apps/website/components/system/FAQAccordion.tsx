"use client";

import { useId, useState } from "react";

export type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
  heading?: string;
  className?: string;
};

export function FAQAccordion({ items, heading = "Frequently asked questions", className = "" }: FAQAccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={className} aria-labelledby={`${baseId}-heading`}>
      <h2 id={`${baseId}-heading`} className="text-2xl font-bold text-foreground md:text-3xl">
        {heading}
      </h2>
      <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
        {items.map((item, index) => {
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;
          const expanded = openIndex === index;
          return (
            <div key={item.question}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  className="flex w-full min-h-12 items-center justify-between gap-4 py-4 text-left text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(expanded ? null : index)}
                >
                  <span>{item.question}</span>
                  <span aria-hidden className="text-rinads-primary">
                    {expanded ? "−" : "+"}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!expanded}
                className="pb-4 text-sm leading-6 text-muted-foreground"
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
