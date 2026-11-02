import { describe, expect, it } from "vitest";

import { resolveTextModelRoute } from "./textModelRoute";

describe("resolveTextModelRoute", () => {
  it("uses Mago cloud only when chosen and signed in", () => {
    expect(
      resolveTextModelRoute({ provider: "cloud", isCloudAccountActive: true })
    ).toBe("cloud");
    expect(
      resolveTextModelRoute({ provider: "cloud", isCloudAccountActive: false })
    ).toBe("local");
    expect(
      resolveTextModelRoute({ provider: "local", isCloudAccountActive: true })
    ).toBe("local");
  });
});
