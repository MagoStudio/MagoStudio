import { UseFormSetValue } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { Seedream5ProType } from "../../schemas/seedream5Pro.schema";

import { clearDrawnMask } from "./clearDrawnMask";

describe("clearDrawnMask", () => {
  it("resets every drawn-mask field to undefined", () => {
    const setValue = vi.fn() as unknown as UseFormSetValue<Seedream5ProType>;

    clearDrawnMask(setValue);

    expect(setValue).toHaveBeenCalledWith("maskLayerDataUrl", undefined);
    expect(setValue).toHaveBeenCalledWith("maskedFrameSrc", undefined);
    expect(setValue).toHaveBeenCalledWith("maskFrameIdx", undefined);
    expect(setValue).toHaveBeenCalledTimes(3);
  });
});
