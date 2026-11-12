import { SheetGroup } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { listUntaggedSpeakers } from "./listUntaggedSpeakers";

const sheetGroup = ({
  token,
  name,
  isEnabled = true
}: {
  token: string;
  name: string;
  isEnabled?: boolean;
}): SheetGroup =>
  ({
    token,
    name,
    kind: "character",
    enabled: isEnabled,
    images: []
  }) as unknown as SheetGroup;

const sheetGroups = [
  sheetGroup({ token: "alex", name: "ALEX" }),
  sheetGroup({ token: "mara", name: "MARA" }),
  sheetGroup({ token: "joe", name: "JOE", isEnabled: false })
];

describe("listUntaggedSpeakers", () => {
  it("names each untagged speaker after the character with its token", () => {
    expect(listUntaggedSpeakers(["alex"], sheetGroups)).toEqual([
      { token: "alex", name: "ALEX" }
    ]);
  });

  it("keeps the order the backend gives", () => {
    expect(
      listUntaggedSpeakers(["mara", "alex"], sheetGroups).map(
        (speaker) => speaker.token
      )
    ).toEqual(["mara", "alex"]);
  });

  it("names a disabled character too", () => {
    expect(listUntaggedSpeakers(["joe"], sheetGroups)).toEqual([
      { token: "joe", name: "JOE" }
    ]);
  });

  it("falls back to the token when no character has it", () => {
    expect(listUntaggedSpeakers(["ghost"], sheetGroups)).toEqual([
      { token: "ghost", name: "ghost" }
    ]);
  });

  it("lists nobody when every speaker is tagged", () => {
    expect(listUntaggedSpeakers([], sheetGroups)).toEqual([]);
  });
});
