import { describe, expect, it } from "vitest";

import { buildEmptySceneShotDraft } from "./buildEmptySceneShotDraft";
import { sumSceneShotDurationSeconds } from "./sumSceneShotDurationSeconds";

const timedShot = (durationSeconds: string) => ({
  ...buildEmptySceneShotDraft(`draft-${durationSeconds}`),
  durationSeconds,
  description: "Beat"
});

describe("sumSceneShotDurationSeconds", () => {
  it("adds up the shots' durations", () => {
    expect(
      sumSceneShotDurationSeconds([timedShot("1.5"), timedShot("3.2")])
    ).toBe(4.7);
  });

  it("ignores a blank shot the user has just added", () => {
    expect(
      sumSceneShotDurationSeconds([
        timedShot("4"),
        buildEmptySceneShotDraft("blank")
      ])
    ).toBe(4);
  });

  it("gives no total while a shot with content has no duration", () => {
    expect(
      sumSceneShotDurationSeconds([timedShot("4"), timedShot("")])
    ).toBeUndefined();
  });
});
