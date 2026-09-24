import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getUserDisplayName } from "../lib/user-display-name";

describe("getUserDisplayName", () => {
  it("prefers preferredName then firstName then displayName then fullName", () => {
    assert.equal(
      getUserDisplayName({
        preferredName: "Andrino",
        firstName: "A",
        displayName: "Boss",
        fullName: "Andrino T",
      }),
      "Andrino"
    );
    assert.equal(
      getUserDisplayName({
        firstName: "Andrino",
        displayName: "Boss",
      }),
      "Andrino"
    );
    assert.equal(getUserDisplayName({ displayName: "Andrino" }), "Andrino");
    assert.equal(getUserDisplayName({ fullName: "Andrino T" }), "Andrino T");
  });

  it("never returns an email or email local-part from email fields", () => {
    assert.equal(
      getUserDisplayName({
        email: "andrinotd2021@gmail.com",
        displayName: null,
      }),
      "there"
    );
    assert.equal(
      getUserDisplayName({
        displayName: "andrinotd2021@gmail.com",
      }),
      "there"
    );
  });

  it("falls back to there when empty", () => {
    assert.equal(getUserDisplayName({}), "there");
    assert.equal(getUserDisplayName({ displayName: "  " }), "there");
  });
});
