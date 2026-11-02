import { describe, expect, it } from "vitest";

import { toSourceVideoTrimKey } from "./toSourceVideoTrimKey";

describe("toSourceVideoTrimKey", () => {
  it("names an untrimmed source the same however it is spelled", () => {
    expect(toSourceVideoTrimKey({})).toBe("full");
    expect(toSourceVideoTrimKey({ trimStartSeconds: 0 })).toBe("full");
  });

  it("names a trim by its start and end in milliseconds", () => {
    expect(
      toSourceVideoTrimKey({ trimStartSeconds: 1.5, trimEndSeconds: 4 })
    ).toBe("1500-4000");
  });

  it("tells apart trims that share a start but not an end", () => {
    expect(toSourceVideoTrimKey({ trimStartSeconds: 1 })).toBe("1000-end");
    expect(
      toSourceVideoTrimKey({ trimStartSeconds: 1, trimEndSeconds: 9 })
    ).toBe("1000-9000");
    expect(toSourceVideoTrimKey({ trimEndSeconds: 9 })).toBe("0-9000");
  });

  it("gives trims that round to the same millisecond one key", () => {
    expect(
      toSourceVideoTrimKey({ trimStartSeconds: 1.0001, trimEndSeconds: 3.0004 })
    ).toBe(toSourceVideoTrimKey({ trimStartSeconds: 1, trimEndSeconds: 3 }));
  });
});
