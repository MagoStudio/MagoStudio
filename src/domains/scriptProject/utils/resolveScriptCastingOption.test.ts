import { Plan } from "@schemas/plan";
import { ScriptVersion } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { resolveScriptCastingOption } from "./resolveScriptCastingOption";

describe("resolveScriptCastingOption", () => {
  it("prefers the submitted request over legacy output-derived metadata", () => {
    const version = { version: 1, split_alts: false } as ScriptVersion;
    const plan = {
      steps: [
        {
          tool_name: "submit_script_casting",
          tool_args: { split_alts: true }
        }
      ]
    } as unknown as Plan;

    expect(resolveScriptCastingOption(version, plan, "split_alts")).toBe(true);
  });

  it("falls back to version metadata when plan detail is unavailable", () => {
    const version = { version: 1, separate_style: true } as ScriptVersion;

    expect(
      resolveScriptCastingOption(version, undefined, "separate_style")
    ).toBe(true);
  });
});
