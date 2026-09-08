import { MarketingPageShell } from "./MarketingPageShell";
import { PageHero } from "./PageHero";

export type LegalSection = {
  heading: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

/**
 * Shared template for legal/trust pages (privacy, terms, cookies).
 * Content is a structural placeholder pending counsel-approved copy — see
 * the notice banner. Do not treat any body text here as final legal
 * language.
 */
export function LegalPage({ eyebrow, title, intro, sections }: LegalPageProps) {
  return (
    <MarketingPageShell>
      <PageHero eyebrow={eyebrow} headline={title} summary={intro} />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-200">
            This page is a placeholder structure pending final, counsel-approved legal copy. It is
            not yet a complete or binding legal document. Contact us for questions in the meantime.
          </div>
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-xl font-bold text-foreground">{section.heading}</h2>
                {section.body.map((paragraph, i) => (
                  <p key={i} className="mt-3 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
