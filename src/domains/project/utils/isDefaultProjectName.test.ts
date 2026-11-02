import { describe, expect, it } from "vitest";

import { isDefaultProjectName } from "./isDefaultProjectName";

const DEFAULT_NAME = "Untitled";

describe("isDefaultProjectName", () => {
  it("matches the base default name", () => {
    expect(isDefaultProjectName("Untitled", DEFAULT_NAME)).toBe(true);
  });

  it("matches numbered defaults from generateUntitledName", () => {
    expect(isDefaultProjectName("Untitled_01", DEFAULT_NAME)).toBe(true);
    expect(isDefaultProjectName("Untitled_99", DEFAULT_NAME)).toBe(true);
    expect(isDefaultProjectName("Untitled_100", DEFAULT_NAME)).toBe(true);
  });

  it("rejects a user-chosen name", () => {
    expect(isDefaultProjectName("My Film", DEFAULT_NAME)).toBe(false);
  });

  it("rejects a name that merely starts with the default", () => {
    expect(isDefaultProjectName("Untitled Symphony", DEFAULT_NAME)).toBe(false);
    expect(isDefaultProjectName("UntitledX", DEFAULT_NAME)).toBe(false);
  });

  it("rejects a non-numeric suffix", () => {
    expect(isDefaultProjectName("Untitled_final", DEFAULT_NAME)).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(isDefaultProjectName("", DEFAULT_NAME)).toBe(false);
  });

  it("honors the passed default name (locale-correct)", () => {
    expect(isDefaultProjectName("Sans titre_02", "Sans titre")).toBe(true);
    expect(isDefaultProjectName("Untitled", "Sans titre")).toBe(false);
  });
});
