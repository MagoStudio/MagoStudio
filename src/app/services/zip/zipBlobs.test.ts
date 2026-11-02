import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";

import { zipBlobs } from "./zipBlobs";

const toBytes = (text: string): Uint8Array => new TextEncoder().encode(text);

const readZip = async (blob: Blob): Promise<Record<string, string>> => {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  const files = unzipSync(buffer);
  const result: Record<string, string> = {};
  for (const [name, data] of Object.entries(files)) {
    result[name] = strFromU8(data);
  }
  return result;
};

describe("zipBlobs", () => {
  it("produces a zip Blob containing every entry", async () => {
    const blob = await zipBlobs([
      { name: "a.mp4", data: toBytes("aaa") },
      { name: "b.mp4", data: toBytes("bbb") }
    ]);

    expect(blob.type).toBe("application/zip");
    const files = await readZip(blob);
    expect(Object.keys(files)).toHaveLength(2);
    expect(files["a.mp4"]).toBe("aaa");
    expect(files["b.mp4"]).toBe("bbb");
  });

  it("de-duplicates repeated names instead of dropping entries", async () => {
    const blob = await zipBlobs([
      { name: "clip.mp4", data: toBytes("first") },
      { name: "clip.mp4", data: toBytes("second") }
    ]);

    const files = await readZip(blob);
    expect(Object.keys(files)).toHaveLength(2);
    expect(files["clip.mp4"]).toBe("first");
    expect(files["clip (1).mp4"]).toBe("second");
  });

  it("returns an empty archive for no entries", async () => {
    const blob = await zipBlobs([]);
    const files = await readZip(blob);
    expect(Object.keys(files)).toHaveLength(0);
  });
});
