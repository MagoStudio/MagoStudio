import { describe, expect, test } from "vitest";

import { readPendingUtm } from "./readPendingUtm";

describe("readPendingUtm", () => {
  test("returns null for null or empty input", () => {
    expect(readPendingUtm(null)).toBeNull();
    expect(readPendingUtm("")).toBeNull();
  });

  test("returns null for malformed JSON", () => {
    expect(readPendingUtm("{not json")).toBeNull();
  });

  test("returns null for non-object JSON", () => {
    expect(readPendingUtm('"a string"')).toBeNull();
    expect(readPendingUtm("[1,2,3]")).toBeNull();
    expect(readPendingUtm("42")).toBeNull();
  });

  test("parses and normalizes a valid pending utm object", () => {
    const raw = JSON.stringify({
      utm_source: "newsletter",
      utm_medium: null,
      utm_campaign: "summer",
      utm_term: null,
      utm_content: null
    });

    expect(readPendingUtm(raw)).toEqual({
      utm_source: "newsletter",
      utm_medium: null,
      utm_campaign: "summer",
      utm_term: null,
      utm_content: null
    });
  });

  test("rejects objects carrying unknown keys (prototype-pollution / tampering defense)", () => {
    expect(readPendingUtm('{"utm_source":"a","__proto__":"x"}')).toBeNull();
    expect(readPendingUtm('{"utm_source":"a","evil":"x"}')).toBeNull();
  });

  test("rejects objects whose values are not string|null", () => {
    expect(readPendingUtm('{"utm_source":123}')).toBeNull();
    expect(readPendingUtm('{"utm_source":{"nested":true}}')).toBeNull();
  });

  test("rejects an all-null object with no real value", () => {
    const raw = JSON.stringify({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null
    });

    expect(readPendingUtm(raw)).toBeNull();
  });
});
