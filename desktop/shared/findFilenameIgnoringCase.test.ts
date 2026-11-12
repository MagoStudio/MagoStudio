import { describe, expect, it } from "vitest";

import { findFilenameIgnoringCase } from "./findFilenameIgnoringCase";

describe("findFilenameIgnoringCase", () => {
  it("returns the installed spelling when only the casing differs", () => {
    expect(
      findFilenameIgnoringCase(
        ["other.gguf", "qwen-image-edit-2511-q5_k_m.gguf"],
        "Qwen-Image-Edit-2511-Q5_K_M.gguf"
      )
    ).toBe("qwen-image-edit-2511-q5_k_m.gguf");
  });

  it("prefers an exact match over a case-insensitive one", () => {
    expect(
      findFilenameIgnoringCase(["model.GGUF", "model.gguf"], "model.gguf")
    ).toBe("model.gguf");
  });

  it("returns undefined when no file matches", () => {
    expect(findFilenameIgnoringCase(["a.gguf"], "b.gguf")).toBeUndefined();
  });
});
