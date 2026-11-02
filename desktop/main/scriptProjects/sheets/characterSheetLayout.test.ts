import { describe, expect, it, vi } from "vitest";

import {
  characterSheetPrompt,
  sheetOutputSize,
  resolveBodyPlan,
  classifyBodyPlan
} from "./characterSheetLayout";
import fixtures from "./characterSheetLayout.fixtures.json";
import {
  BODY_PLAN_QUESTION,
  BODY_PLAN_SCHEMA
} from "./characterSheetLayout.generated";

describe("production character-sheet parity", () => {
  it("matches the backend prompt for legacy text, body plans and aspect ratios", () => {
    for (const item of fixtures.prompts)
      expect(
        characterSheetPrompt(
          item.appearance,
          resolveBodyPlan(item.bodyPlan),
          item.frame
        )
      ).toBe(item.expected);
  });
  it("matches backend sheet dimensions for every entity kind", () => {
    for (const item of fixtures.sizes)
      expect(sheetOutputSize(item.kind, item.size)).toEqual(item.expected);
  });
  it("uses the production classifier question/schema and tolerates model failures", async () => {
    const call = vi.fn().mockResolvedValue('{"body_plan":"four_legged"}');
    expect(await classifyBodyPlan("A cat", call)).toBe("four_legged");
    expect(call).toHaveBeenCalledWith(
      BODY_PLAN_QUESTION +
        "A cat\n\nReturn JSON matching this schema: " +
        JSON.stringify(BODY_PLAN_SCHEMA)
    );
    expect(await classifyBodyPlan("A cat", async () => "invalid")).toBeNull();
    expect(
      await classifyBodyPlan("A cat", async () => {
        throw new Error("offline");
      })
    ).toBeNull();
  });
});
