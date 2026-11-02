import { Layer } from "@schemas/layer";
import { describe, expect, it } from "vitest";

import { isTrackMirroredFromCloud } from "./isTrackMirroredFromCloud";

const track = (extraFields: Record<string, unknown> = {}): Layer =>
  ({ id: "track-id", ...extraFields }) as unknown as Layer;

describe("isTrackMirroredFromCloud", () => {
  it("is true for a track the cloud mirror wrote", () => {
    expect(isTrackMirroredFromCloud(track({ cloud_mirrored: true }))).toBe(
      true
    );
  });

  it("is false for a local-only track of a cloud project", () => {
    expect(isTrackMirroredFromCloud(track({ cloud_mirrored: false }))).toBe(
      false
    );
  });

  it("is false for a track that carries no mirror flag", () => {
    expect(isTrackMirroredFromCloud(track())).toBe(false);
  });
});
