import { describe, expect, it } from "vitest";

import { LOCAL_NODE_PACK_PINS } from "./localNodePackPins";
describe("bundled node pack pins", () => {
  it("pins all six packs to immutable commits or registry versions and SHA-256", () => {
    expect(Object.values(LOCAL_NODE_PACK_PINS)).toHaveLength(6);
    for (const pin of Object.values(LOCAL_NODE_PACK_PINS)) {
      expect(pin.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(pin.url).not.toMatch(/HEAD|latest|\/main\.|\/master\./);
      expect(pin.url).toContain(pin.revision);
      if (pin.stripRoot) expect(pin.revision).toMatch(/^[a-f0-9]{40}$/);
      else expect(pin.revision).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
