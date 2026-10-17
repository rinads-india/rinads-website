/**
 * Voice choices for `runway:sync` (pure, so they can be unit-tested).
 *
 * Runway's preset voices are documented for English among others, but Malayalam
 * is not on Runway's list. Voice *design* uses Runway's `eleven_ttv_v3` model
 * (ElevenLabs v3, which lists Malayalam), so it is the documented route to a
 * voice that can speak both English and Malayalam. Quality still has to be
 * heard — see docs/runbooks/RINPO-LIVE-CHARACTER.md.
 */

/** Runway requires a design prompt of at least 20 characters. */
export const MIN_VOICE_PROMPT_CHARS = 20;

export const DEFAULT_VOICE_DESIGN_PROMPT =
  "A warm, friendly, curious young-sounding voice with a clear, neutral Indian accent. " +
  "Speaks both English and Malayalam fluently and naturally, at a calm, measured pace, " +
  "professional yet approachable.";

export function validateVoicePrompt(prompt: string): string | null {
  const trimmed = prompt.trim();
  if (trimmed.length < MIN_VOICE_PROMPT_CHARS) {
    return `--voice-prompt must be at least ${MIN_VOICE_PROMPT_CHARS} characters (got ${trimmed.length}).`;
  }
  return null;
}

export type VoiceChoices = {
  cloneVoice?: boolean;
  designVoice?: boolean;
  voiceId?: string;
  voicePreset?: string;
};

/** At most one way of choosing the voice may be given. */
export function voiceChoiceError(choices: VoiceChoices): string | null {
  const chosen = [
    choices.cloneVoice ? "--clone-voice" : null,
    choices.designVoice ? "--design-voice" : null,
    choices.voiceId ? "--voice-id" : null,
    choices.voicePreset ? "--voice-preset" : null,
  ].filter((flag): flag is string => flag !== null);
  return chosen.length > 1
    ? `Choose one voice option, not several: ${chosen.join(", ")}.`
    : null;
}
