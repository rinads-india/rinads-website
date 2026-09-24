import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

describe("RINPO channel UX V2 contracts", () => {
  it("uses dedicated Voice and Phone clients instead of the generic channel page", () => {
    const voice = read("../app/rinpo/voice/page.tsx");
    const phone = read("../app/rinpo/phone/page.tsx");

    assert.match(voice, /VoiceClient/);
    assert.doesNotMatch(voice, /RinpoChannelPage/);
    assert.match(phone, /PhoneClient/);
    assert.doesNotMatch(phone, /RinpoChannelPage/);
  });

  it("keeps the story explicitly fictional and removes unsupported world-first claims", () => {
    const story = read("../components/story/StoryNarrative.tsx");

    assert.match(story, /fictional brand lore/i);
    assert.match(story, /The character is fiction\. The interface is product design\./);
    assert.doesNotMatch(story, /World.?s First/i);
    assert.doesNotMatch(story, /operations automated/i);
  });

  it("keeps Phone transparent about current telephony maturity", () => {
    const phone = read("../app/rinpo/phone/PhoneClient.tsx");

    assert.match(phone, /Live PSTN\/telephony calling is not available/i);
    assert.match(phone, /product direction, not a production calling service/i);
    assert.match(phone, /no live phone call/i);
  });

  it("labels public Voice as a browser speech demo", () => {
    const voice = read("../app/rinpo/voice/VoiceClient.tsx");

    assert.match(voice, /Browser voice demo/);
    assert.match(voice, /Web Speech implementation/);
    assert.match(voice, /product actions remaining behind the platform's actual controls/);
  });

  it("removes fabricated live-notification and instant-action claims from the RINPO handset", () => {
    const extra = read("../components/rinpo/RinpoPhoneScreens/PhoneExtraScreens.tsx");

    assert.doesNotMatch(extra, /RINPO Vision/);
    assert.doesNotMatch(extra, /2 New/);
    assert.doesNotMatch(extra, /Instant AI analysis/);
    assert.match(extra, /not a live notification feed/i);
    assert.match(extra, /do not book meetings, run external audits, or execute outside actions/i);
  });

  it("keeps the spoken RINPO intro aligned to the governed interaction model", () => {
    const voiceHook = read("../hooks/useRinpoVoice.ts");

    assert.match(voiceHook, /permissions, confirmation, approval, and runtime paths/i);
    assert.doesNotMatch(voiceHook, /operations.*run themselves/i);
    assert.doesNotMatch(voiceHook, /We've got you covered/i);
  });
});
