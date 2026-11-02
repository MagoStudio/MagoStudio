import { describe, expect, test } from "vitest";

import { buildUtmMetadata } from "./buildUtmMetadata";

describe("buildUtmMetadata", () => {
  test("returns all five keys when every param is present", () => {
    expect(
      buildUtmMetadata(
        "?utm_source=newsletter&utm_medium=email&utm_campaign=summer&utm_term=discount&utm_content=banner"
      )
    ).toEqual({
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "summer",
      utm_term: "discount",
      utm_content: "banner"
    });
  });

  test("fills absent keys with null so deep-merge replaces the touch", () => {
    expect(buildUtmMetadata("?utm_source=newsletter")).toEqual({
      utm_source: "newsletter",
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null
    });
  });

  test("treats empty-string params as absent", () => {
    expect(buildUtmMetadata("?utm_source=newsletter&utm_term=")).toEqual({
      utm_source: "newsletter",
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null
    });
  });

  test("returns null when no utm params are present", () => {
    expect(buildUtmMetadata("?ref=abc&foo=bar")).toBeNull();
    expect(buildUtmMetadata("")).toBeNull();
  });

  test("caps each value length to guard against oversized URLs", () => {
    const huge = "x".repeat(5000);
    const result = buildUtmMetadata(`?utm_source=${huge}`);

    expect(result?.utm_source).toHaveLength(200);
  });

  test("accepts a URLSearchParams instance", () => {
    const params = new URLSearchParams("utm_campaign=launch");
    expect(buildUtmMetadata(params)).toEqual({
      utm_source: null,
      utm_medium: null,
      utm_campaign: "launch",
      utm_term: null,
      utm_content: null
    });
  });
});
