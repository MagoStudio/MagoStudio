import { describe, expect, it, vi } from "vitest";

import { clearIteratedFormValues } from "./clearIteratedFormValues";

describe("clearIteratedFormValues", () => {
  it("clears iteratedAssetId and iteratedSourceFrame with change-triggering options", () => {
    const setValue = vi.fn();

    clearIteratedFormValues(setValue);

    expect(setValue).toHaveBeenCalledTimes(2);
    expect(setValue).toHaveBeenNthCalledWith(1, "iteratedAssetId", undefined, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    expect(setValue).toHaveBeenNthCalledWith(
      2,
      "iteratedSourceFrame",
      undefined,
      {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      }
    );
  });
});
