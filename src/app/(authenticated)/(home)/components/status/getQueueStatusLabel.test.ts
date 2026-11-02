import { describe, expect, it } from "vitest";

import { getQueueStatusLabel } from "./getQueueStatusLabel";

describe("getQueueStatusLabel", () => {
  it("returns undefined when the position is undefined", () => {
    expect(getQueueStatusLabel(undefined)).toBeUndefined();
  });

  it("returns the localized 'next' label for the head of the queue", () => {
    expect(getQueueStatusLabel(0, (key) => `t:${key}`)).toBe(
      "t:status.in_queue_next.label"
    );
  });

  it("falls back to the English 'next' label when no translator is given", () => {
    expect(getQueueStatusLabel(0)).toBe("In Queue: Next");
  });

  it("returns the ordinal queue position for later items", () => {
    expect(getQueueStatusLabel(1, (key) => `t:${key}`)).toBe("In Queue: 2nd");
    expect(getQueueStatusLabel(2, (key) => `t:${key}`)).toBe("In Queue: 3rd");
  });
});
