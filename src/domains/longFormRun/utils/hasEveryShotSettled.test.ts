import { describe, expect, it } from "vitest";

import { hasEveryShotSettled } from "./hasEveryShotSettled";

describe("hasEveryShotSettled", () => {
  it("is false when no Shot exists at all", () => {
    expect(hasEveryShotSettled([])).toBe(false);
  });

  it("is true when every Shot has rendered", () => {
    expect(hasEveryShotSettled(["ready", "ready"])).toBe(true);
  });

  it("is true when every Shot has either rendered or failed", () => {
    expect(hasEveryShotSettled(["ready", "failed"])).toBe(true);
  });

  it("is true when every Shot failed", () => {
    expect(hasEveryShotSettled(["failed", "failed"])).toBe(true);
  });

  it("is false while one Shot is still rendering", () => {
    expect(hasEveryShotSettled(["ready", "rendering"])).toBe(false);
  });

  it("is false while one Shot has not started", () => {
    expect(hasEveryShotSettled(["ready", "notStarted"])).toBe(false);
  });
});
