import { describe, expect, test } from "vitest";

import { buildShotVideoFileFromBlob } from "./buildShotVideoFileFromBlob";

describe("buildShotVideoFileFromBlob", () => {
  test("keeps a normal layer name as the file name", () => {
    const blob = new Blob(["fake-video-bytes"], { type: "video/mp4" });

    const file = buildShotVideoFileFromBlob(blob, "My clip");

    expect(file.name).toBe("My clip.mp4");
    expect(file.type).toBe("video/mp4");
  });

  test("strips path separators and control characters from the layer name", () => {
    const blob = new Blob(["fake-video-bytes"], { type: "video/mp4" });

    const file = buildShotVideoFileFromBlob(blob, "../../etc/passwd\x00");

    expect(file.name).not.toContain("/");
    expect(file.name).not.toContain("\x00");
    expect(file.name.endsWith(".mp4")).toBe(true);
  });

  test("clamps overly long layer names", () => {
    const blob = new Blob(["fake-video-bytes"], { type: "video/mp4" });
    const longName = "a".repeat(200);

    const file = buildShotVideoFileFromBlob(blob, longName);

    expect(file.name).toBe(`${"a".repeat(100)}.mp4`);
  });

  test("falls back to a default name for an empty layer name", () => {
    const blob = new Blob(["fake-video-bytes"], { type: "video/mp4" });

    const file = buildShotVideoFileFromBlob(blob, "");

    expect(file.name).toBe("render.mp4");
  });

  test("falls back to video/mp4 when the blob has no type", () => {
    const blob = new Blob(["fake-video-bytes"]);

    const file = buildShotVideoFileFromBlob(blob, "My clip");

    expect(file.type).toBe("video/mp4");
  });
});
