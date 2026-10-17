/**
 * Languages offered by RINPO Live (Runway Characters video conversation).
 *
 * RINPO Live speaks English and Malayalam. A Runway Character speaks whatever
 * language its personality instructs, so language is a per-session override
 * (personality + startScript) rather than a separate avatar.
 *
 * Voice quality is a separate question from instruction-following. English is
 * a documented Runway voice language; Malayalam is not listed by Runway, so it
 * stays labelled "beta" in the UI until it has been heard with the chosen
 * voice (see docs/runbooks/RINPO-LIVE-CHARACTER.md → Malayalam).
 *
 * Add a language here and it flows through the picker, the personality and
 * the API validation — nothing else needs to change.
 */

export type LiveLanguageCode = "auto" | "en" | "ml";

/**
 * - `auto`: RINPO follows whichever of English / Malayalam the visitor speaks.
 * - `documented`: listed by Runway as supported for generated voices.
 * - `beta`: the model can be instructed to use it, but voice quality has not
 *   been verified — surfaced honestly in the UI.
 */
export type LiveLanguageSupport = "auto" | "documented" | "beta";

export type LiveLanguage = {
  code: LiveLanguageCode;
  /** Label in English, used in prompts and the picker. */
  label: string;
  /** Label in the language itself. */
  nativeLabel: string;
  support: LiveLanguageSupport;
  /** Opening line RINPO speaks (Runway `startScript`, max 2000 chars). */
  greeting: string;
};

export const LIVE_LANGUAGES: readonly LiveLanguage[] = [
  {
    code: "auto",
    label: "Auto (English / Malayalam)",
    nativeLabel: "Auto · English / മലയാളം",
    support: "auto",
    greeting:
      "Hi, I'm RINPO, your guide to RINADS. You can speak to me in English or Malayalam, and I'll follow you. What would you like to explore?",
  },
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    support: "documented",
    greeting:
      "Hi, I'm RINPO, your guide to RINADS. What would you like to explore today?",
  },
  {
    code: "ml",
    label: "Malayalam",
    nativeLabel: "മലയാളം",
    support: "beta",
    greeting:
      "നമസ്കാരം! ഞാൻ RINPO, RINADS-ലേക്കുള്ള നിങ്ങളുടെ വഴികാട്ടി. ഇന്ന് എന്താണ് അറിയാൻ ആഗ്രഹിക്കുന്നത്?",
  },
] as const;

export const DEFAULT_LIVE_LANGUAGE: LiveLanguageCode = "auto";

export function isLiveLanguageCode(value: unknown): value is LiveLanguageCode {
  return LIVE_LANGUAGES.some((language) => language.code === value);
}

export function getLiveLanguage(code: LiveLanguageCode): LiveLanguage {
  // The registry always contains every code in LiveLanguageCode.
  return LIVE_LANGUAGES.find((language) => language.code === code) as LiveLanguage;
}
