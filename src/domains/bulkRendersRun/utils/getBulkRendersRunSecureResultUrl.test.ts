import { describe, expect, it } from "vitest";

import { getBulkRendersRunSecureResultUrl } from "./getBulkRendersRunSecureResultUrl";

describe("getBulkRendersRunSecureResultUrl", () => {
  it("accepts a blob url", () => {
    expect(
      getBulkRendersRunSecureResultUrl("blob:https://mago.studio/asset-1")
    ).toBe("blob:https://mago.studio/asset-1");
  });

  it("accepts an https url", () => {
    expect(
      getBulkRendersRunSecureResultUrl("https://placehold.co/189x306")
    ).toBe("https://placehold.co/189x306");
  });

  it("drops a rejected http url instead of throwing", () => {
    expect(() =>
      getBulkRendersRunSecureResultUrl("http://placehold.co/189x306")
    ).not.toThrow();
    expect(
      getBulkRendersRunSecureResultUrl("http://placehold.co/189x306")
    ).toBeUndefined();
  });

  it("drops a non-string value instead of calling a string method on it", () => {
    expect(getBulkRendersRunSecureResultUrl(1234)).toBeUndefined();
    expect(
      getBulkRendersRunSecureResultUrl({ url: "https://x" })
    ).toBeUndefined();
    expect(getBulkRendersRunSecureResultUrl(null)).toBeUndefined();
  });

  it("returns undefined when there is no url to validate", () => {
    expect(getBulkRendersRunSecureResultUrl(undefined)).toBeUndefined();
  });
});
