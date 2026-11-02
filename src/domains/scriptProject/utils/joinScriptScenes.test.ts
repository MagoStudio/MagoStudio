import { describe, expect, it } from "vitest";

import { joinScriptScenes } from "./joinScriptScenes";

describe("joinScriptScenes", () => {
  it("labels each scene with its own number, blank line between", () => {
    expect(
      joinScriptScenes([
        { scene_number: 1, prompt: "Scene one." },
        { scene_number: 2, prompt: "Scene two." },
        { scene_number: 3, prompt: "Scene three." }
      ])
    ).toBe(
      "Shot 1:\nScene one.\n\nShot 2:\nScene two.\n\nShot 3:\nScene three."
    );
  });

  it("leaves a single scene bare, with no leading or trailing blank line", () => {
    expect(joinScriptScenes([{ scene_number: 1, prompt: "Scene one." }])).toBe(
      "Shot 1:\nScene one."
    );
  });

  it("labels a scene with the Agent's own number, not its position in the array", () => {
    expect(
      joinScriptScenes([
        { scene_number: 5, prompt: "Scene five." },
        { scene_number: 12, prompt: "Scene twelve." }
      ])
    ).toBe("Shot 5:\nScene five.\n\nShot 12:\nScene twelve.");
  });

  it("returns an empty string for no scenes", () => {
    expect(joinScriptScenes([])).toBe("");
  });

  it("trims each scene's prompt before labelling it", () => {
    expect(
      joinScriptScenes([
        { scene_number: 1, prompt: "  Scene one.  " },
        { scene_number: 2, prompt: "  Scene two.  " }
      ])
    ).toBe("Shot 1:\nScene one.\n\nShot 2:\nScene two.");
  });

  it("drops a blank scene rather than leaving an extra blank line", () => {
    expect(
      joinScriptScenes([
        { scene_number: 1, prompt: "Scene one." },
        { scene_number: 2, prompt: "   " },
        { scene_number: 3, prompt: "Scene two." }
      ])
    ).toBe("Shot 1:\nScene one.\n\nShot 3:\nScene two.");
  });

  it("puts a scene's dialogue under its prompt", () => {
    expect(
      joinScriptScenes([
        {
          scene_number: 1,
          prompt: "Close-up of Maya at the helm.",
          dialogue_or_vo: "MAYA: We're almost there.\nVO: She wasn't."
        },
        { scene_number: 2, prompt: "Wide of the storm." }
      ])
    ).toBe(
      "Shot 1:\nClose-up of Maya at the helm.\nMAYA: We're almost there.\nVO: She wasn't.\n\nShot 2:\nWide of the storm."
    );
  });

  it("adds nothing for blank or missing dialogue", () => {
    expect(
      joinScriptScenes([
        { scene_number: 1, prompt: "Scene one.", dialogue_or_vo: "   " },
        { scene_number: 2, prompt: "Scene two.", dialogue_or_vo: null }
      ])
    ).toBe("Shot 1:\nScene one.\n\nShot 2:\nScene two.");
  });
});
