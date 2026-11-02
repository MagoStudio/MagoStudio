import { describe, expect, it } from "vitest";

import { buildTrimMetadataFile } from "./buildTrimMetadataFile";

describe("buildTrimMetadataFile", () => {
  it("names the file metadata.json and types it as JSON", () => {
    const file = buildTrimMetadataFile({ trimStart: 0, trimEnd: 1 });

    expect(file.name).toBe("metadata.json");
    expect(file.type).toBe("application/json");
  });

  it("converts seconds to floored milliseconds", async () => {
    const file = buildTrimMetadataFile({ trimStart: 1.2345, trimEnd: 9.9999 });

    expect(JSON.parse(await file.text())).toEqual({
      "trim-start": 1234,
      "trim-end": 9999
    });
  });

  it("handles a zero-length trim", async () => {
    const file = buildTrimMetadataFile({ trimStart: 0, trimEnd: 0 });

    expect(JSON.parse(await file.text())).toEqual({
      "trim-start": 0,
      "trim-end": 0
    });
  });
});
