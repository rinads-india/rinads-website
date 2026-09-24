import { AwaitingCounselNotice } from "./AwaitingCounselNotice";
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
 * Shared template for legal/trust pages (privacy, terms, cookies, DPA, subprocessors).
 * Content is a structural placeholder pending counsel-approved copy — see
 * AwaitingCounselNotice. Do not treat any body text here as final legal
 * language.
 */
export function LegalPage({ eyebrow, title, intro, sections }: LegalPageProps) {
  return (
    <MarketingPageShell>
      <PageHero eyebrow={eyebrow} headline={title} summary={intro} />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          <AwaitingCounselNotice documentLabel={title} />
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
