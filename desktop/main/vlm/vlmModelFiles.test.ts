import { describe, expect, it } from "vitest";

import {
  QWEN3_VL_MODEL_ALTERNATIVES,
  QWEN3_VL_MODEL_FILES,
  resolveModelFile
} from "./vlmModelFiles";

const resolveGguf = (available: string[]) =>
  resolveModelFile(
    available,
    QWEN3_VL_MODEL_FILES.gguf,
    QWEN3_VL_MODEL_ALTERNATIVES.gguf
  );

const resolveMmproj = (available: string[]) =>
  resolveModelFile(
    available,
    QWEN3_VL_MODEL_FILES.mmproj,
    QWEN3_VL_MODEL_ALTERNATIVES.mmproj
  );

describe("resolveModelFile", () => {
  it("matches on basename so ComfyUI's subfolder prefix and separator don't matter", () => {
    expect(resolveGguf(["GGUF\\Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf"])).toBe(
      "GGUF\\Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf"
    );
    expect(resolveGguf(["vlm/GGUF/Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf"])).toBe(
      "vlm/GGUF/Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf"
    );
  });

  it("prefers the primary quant over an accepted alternative", () => {
    expect(
      resolveGguf([
        "GGUF/Qwen3-VL-2B-Instruct-Q8_0.gguf",
        "GGUF/Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf"
      ])
    ).toBe("GGUF/Qwen3-VL-2B-Instruct-UD-Q8_K_XL.gguf");
  });

  it("falls back through the alternatives in order", () => {
    expect(resolveGguf(["GGUF/Qwen3-VL-2B-Instruct-Q8_0.gguf"])).toBe(
      "GGUF/Qwen3-VL-2B-Instruct-Q8_0.gguf"
    );
    expect(
      resolveMmproj(["GGUF/mmproj-F32.gguf", "GGUF/mmproj-F16.gguf"])
    ).toBe("GGUF/mmproj-F16.gguf");
  });

  it("ignores case, as ComfyUI reports whatever the filesystem has", () => {
    expect(resolveMmproj(["GGUF/MMPROJ-BF16.GGUF"])).toBe(
      "GGUF/MMPROJ-BF16.GGUF"
    );
  });

  it("returns null when nothing acceptable is present", () => {
    expect(resolveGguf([])).toBeNull();
    expect(resolveGguf(["GGUF/Qwen3-VL-8B-Instruct-Q8_0.gguf"])).toBeNull();
    // A different model's mmproj must not be accepted for the 2B pairing.
    expect(
      resolveMmproj(["GGUF/mmproj-Qwen3VL-8B-Instruct-F16.gguf"])
    ).toBeNull();
  });
});
