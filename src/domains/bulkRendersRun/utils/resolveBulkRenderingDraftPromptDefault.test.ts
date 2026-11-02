import { describe, expect, it } from "vitest";

import { resolveBulkRenderingDraftPromptDefault } from "./resolveBulkRenderingDraftPromptDefault";

describe("resolveBulkRenderingDraftPromptDefault", () => {
  it("keeps a non-empty stored prompt over the model default", () => {
    const result = resolveBulkRenderingDraftPromptDefault({
      storedPromptValue: "a stored prompt",
      modelDefaultPrompt: "the model default"
    });

    expect(result).toBe("a stored prompt");
  });

  it("falls back to the model default when the stored prompt is an empty string", () => {
    const result = resolveBulkRenderingDraftPromptDefault({
      storedPromptValue: "",
      modelDefaultPrompt: "the model default"
    });

    expect(result).toBe("the model default");
  });

  it("falls back to the model default when the stored value is not a string", () => {
    const result = resolveBulkRenderingDraftPromptDefault({
      storedPromptValue: { prompt: "nested" },
      modelDefaultPrompt: "the model default"
    });

    expect(result).toBe("the model default");
  });

  it("falls back to the model default when the stored value is undefined", () => {
    const result = resolveBulkRenderingDraftPromptDefault({
      storedPromptValue: undefined,
      modelDefaultPrompt: "the model default"
    });

    expect(result).toBe("the model default");
  });

  it("floors to an empty string when neither the stored prompt nor the model default carry one", () => {
    const result = resolveBulkRenderingDraftPromptDefault({
      storedPromptValue: "",
      modelDefaultPrompt: ""
    });

    expect(result).toBe("");
  });
});
