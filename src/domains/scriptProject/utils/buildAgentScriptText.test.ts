import { describe, expect, it } from "vitest";

import { buildAgentScriptText } from "./buildAgentScriptText";

describe("buildAgentScriptText", () => {
  it("lays out a screenplay document as a screenplay", () => {
    expect(
      buildAgentScriptText({
        scenes: [],
        screenplay_scenes: [
          {
            scene_number: 1,
            heading: "INT. KITCHEN - NIGHT",
            elements: [{ type: "action", text: "Maya waits." }]
          }
        ]
      })
    ).toBe("INT. KITCHEN - NIGHT\n\nMaya waits.");
  });

  it("keeps the Shot N: text for a document written before screenplay scenes", () => {
    expect(
      buildAgentScriptText({
        scenes: [
          { scene_number: 1, prompt: "A quiet street.", reference_tags: [] }
        ],
        screenplay_scenes: []
      })
    ).toBe("Shot 1:\nA quiet street.");
  });
});
