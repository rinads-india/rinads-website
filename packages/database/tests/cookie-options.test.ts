import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidParentCookieDomain,
  sharedAuthCookieOptions,
} from "../src/browser";

describe("shared Supabase auth cookie options", () => {
  it("accepts only a syntactically valid leading-dot parent domain", () => {
    assert.equal(isValidParentCookieDomain(".rinads.com"), true);
    assert.equal(isValidParentCookieDomain(".auth.rinads.com"), true);
    for (const value of [
      "rinads.com",
      "https://rinads.com",
      ".rinads.com/path",
      ".rinads.com:443",
      ".localhost",
      ".-rinads.com",
      ".rinads..com",
    ]) {
      assert.equal(isValidParentCookieDomain(value), false, value);
    }
  });

  it("uses secure cross-subdomain cookies only in Production", () => {
    assert.deepEqual(
      sharedAuthCookieOptions({
        cookieDomain: ".rinads.com",
        production: true,
      }),
      {
        domain: ".rinads.com",
        path: "/",
        sameSite: "lax",
        secure: true,
      }
    );
    assert.equal(
      sharedAuthCookieOptions({
        cookieDomain: ".rinads.com",
        production: false,
      }),
      undefined
    );
    assert.equal(
      sharedAuthCookieOptions({
        cookieDomain: "https://rinads.com",
        production: true,
      }),
      undefined
    );
  });
});
