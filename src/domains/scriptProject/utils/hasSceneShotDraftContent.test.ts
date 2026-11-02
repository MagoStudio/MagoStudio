import { describe, expect, it } from "vitest";

import { buildEmptySceneShotDraft } from "./buildEmptySceneShotDraft";
import { hasSceneShotDraftContent } from "./hasSceneShotDraftContent";

describe("hasSceneShotDraftContent", () => {
  it("is false for a shot with only blank fields", () => {
    expect(
      hasSceneShotDraftContent({
        ...buildEmptySceneShotDraft("draft"),
        description: "   "
      })
    ).toBe(false);
  });

  it("is false for an added shot that only has its pre-filled duration", () => {
    expect(
      hasSceneShotDraftContent({
        ...buildEmptySceneShotDraft("draft"),
        durationSeconds: "5"
      })
    ).toBe(false);
  });

  it("is true once the framing differs from the default", () => {
    expect(
      hasSceneShotDraftContent({
        ...buildEmptySceneShotDraft("draft"),
        framing: "Wide"
      })
    ).toBe(true);
  });

  it("is true once the shot has a prompt", () => {
    expect(
      hasSceneShotDraftContent({
        ...buildEmptySceneShotDraft("draft"),
        description: "Pause."
      })
    ).toBe(true);
  });

  it("is true for a shot with only dialogue, so its lines are never dropped", () => {
    expect(
      hasSceneShotDraftContent({
        ...buildEmptySceneShotDraft("draft"),
        dialogue: "RUBY: Wait!"
      })
    ).toBe(true);
  });
});
