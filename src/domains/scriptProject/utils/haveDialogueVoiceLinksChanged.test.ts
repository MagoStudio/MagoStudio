import { describe, expect, it } from "vitest";

import { haveDialogueVoiceLinksChanged } from "./haveDialogueVoiceLinksChanged";

describe("haveDialogueVoiceLinksChanged", () => {
  it("spots a line that gained a voice", () => {
    expect(
      haveDialogueVoiceLinksChanged(
        [{ speaker: "HER", line: "Hi" }],
        [{ speaker: "HER", line: "Hi", speaker_token: "her_emilia" }]
      )
    ).toBe(true);
  });

  it("ignores dialogue whose voices are unchanged", () => {
    expect(
      haveDialogueVoiceLinksChanged(
        [{ speaker: "HER", line: "Hi", speaker_token: "her_emilia" }],
        [{ speaker: "HER", line: "Hi", speaker_token: "her_emilia" }]
      )
    ).toBe(false);
  });
});
