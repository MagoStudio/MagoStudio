import { describe, expect, it } from "vitest";

import { readCloudLayerOrder } from "./readCloudLayerOrder";

describe("readCloudLayerOrder", () => {
  it("reads the layer order prod returns", () => {
    expect(readCloudLayerOrder({ id: "l1", layer_order: 3 })).toBe(3);
  });

  it("returns null when the order is missing or not a number", () => {
    expect(readCloudLayerOrder({ id: "l1" })).toBeNull();
    expect(readCloudLayerOrder({ layer_order: "2" })).toBeNull();
    expect(readCloudLayerOrder(null)).toBeNull();
  });
});
