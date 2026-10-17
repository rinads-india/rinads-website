/**
 * Languages offered by RINPO Live (Runway Characters video conversation).
 *
 * A Runway Character speaks whatever language its personality instructs, so
 * language is a per-session override (personality + startScript) rather than a
 * separate avatar. Voice quality is a separate question: Runway documents a
 * fixed set of languages for its voices, and anything outside that set is
 * labelled "beta" in the UI until it has been verified with the chosen voice.
 *
 * Add a language here and it flows through the picker, the personality and
 * the API validation — nothing else needs to change.
 */

export type LiveLanguageCode =
  | "auto"
  | "en"
  | "hi"
  | "ml"
  | "ta"
  | "ar"
  | "es"
  | "fr"
  | "de";

/**
 * - `auto`: RINPO follows whichever language the visitor speaks.
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
    label: "Auto-detect",
    nativeLabel: "Auto",
    support: "auto",
    greeting:
      "Hi, I'm RINPO, your guide to RINADS. You can speak to me in your own language and I'll follow you. What would you like to explore?",
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
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    support: "documented",
    greeting:
      "नमस्ते! मैं RINPO हूँ, RINADS में आपका गाइड। आज आप क्या जानना चाहेंगे?",
  },
  {
    code: "ml",
    label: "Malayalam",
    nativeLabel: "മലയാളം",
    support: "beta",
    greeting:
      "നമസ്കാരം! ഞാൻ RINPO, RINADS-ലേക്കുള്ള നിങ്ങളുടെ വഴികാട്ടി. ഇന്ന് എന്താണ് അറിയാൻ ആഗ്രഹിക്കുന്നത്?",
  },
  {
    code: "ta",
    label: "Tamil",
    nativeLabel: "தமிழ்",
    support: "beta",
    greeting:
      "வணக்கம்! நான் RINPO, RINADS-க்கான உங்கள் வழிகாட்டி. இன்று எதைப் பற்றி தெரிந்துகொள்ள விரும்புகிறீர்கள்?",
  },
  {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    support: "beta",
    greeting:
      "مرحبًا! أنا RINPO، دليلك إلى RINADS. ماذا تود أن تستكشف اليوم؟",
  },
  {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    support: "documented",
    greeting:
      "¡Hola! Soy RINPO, tu guía de RINADS. ¿Qué te gustaría explorar hoy?",
  },
  {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    support: "documented",
    greeting:
      "Bonjour ! Je suis RINPO, votre guide RINADS. Qu'aimeriez-vous découvrir aujourd'hui ?",
  },
  {
    code: "de",
    label: "German",
    nativeLabel: "Deutsch",
    support: "documented",
    greeting:
      "Hallo! Ich bin RINPO, Ihr Guide durch RINADS. Was möchten Sie heute entdecken?",
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
