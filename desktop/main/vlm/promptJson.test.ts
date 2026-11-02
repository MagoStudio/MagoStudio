import { describe, expect, it } from "vitest";

import {
  extractJsonObject,
  readCachedPrompt,
  toPositivePrompt,
  toStructuredPrompt
} from "./promptJson";

describe("extractJsonObject", () => {
  it("parses a bare object", () => {
    expect(extractJsonObject('{"positive": "a cat"}')).toEqual({
      positive: "a cat"
    });
  });

  it("parses a fenced object", () => {
    expect(extractJsonObject('```json\n{"positive": "a cat"}\n```')).toEqual({
      positive: "a cat"
    });
  });

  it("ignores prose before and after the object", () => {
    expect(
      extractJsonObject(
        'Sure! Here is the JSON:\n{"positive": "a cat"}\nLet me know if you need more.'
      )
    ).toEqual({ positive: "a cat" });
  });

  it("keeps braces that appear inside strings", () => {
    expect(
      extractJsonObject('{"positive": "a cat {sitting} still", "negative": ""}')
    ).toEqual({ positive: "a cat {sitting} still", negative: "" });
  });

  it("handles escaped quotes without ending the string early", () => {
    expect(extractJsonObject('{"positive": "a \\"good\\" cat"}')).toEqual({
      positive: 'a "good" cat'
    });
  });

  it("returns null for malformed or absent JSON", () => {
    expect(extractJsonObject("a cat, oil painting")).toBeNull();
    expect(extractJsonObject('{"positive": }')).toBeNull();
    expect(extractJsonObject('{"positive": "unterminated')).toBeNull();
    expect(extractJsonObject('["a", "b"]')).toBeNull();
  });
});

describe("toStructuredPrompt", () => {
  it("projects a style.txt-shaped object", () => {
    expect(
      toStructuredPrompt({
        positive: {
          content: "a woman walking",
          setting: "city street, dusk",
          style: "oil painting",
          references: "Sargent"
        },
        negative: "night"
      })
    ).toEqual({
      positive: {
        content: "a woman walking",
        setting: "city street, dusk",
        style: "oil painting",
        references: "Sargent"
      },
      negative: "night"
    });
  });

  it("folds video.txt's extra action field into content", () => {
    const prompt = toStructuredPrompt({
      positive: {
        content: "a woman walking",
        setting: "city street",
        action: "a smooth tracking shot follows her",
        style: "cinematic",
        references: ""
      },
      negative: ""
    });
    expect(prompt?.positive.content).toBe(
      "a woman walking a smooth tracking shot follows her"
    );
  });

  it("accepts a plain-string positive", () => {
    expect(toStructuredPrompt({ positive: "a cat" })).toEqual({
      positive: { content: "a cat", setting: "", style: "", references: "" },
      negative: ""
    });
  });

  it("drops non-string field values rather than leaking them", () => {
    const prompt = toStructuredPrompt({
      positive: { content: "a cat", setting: 42, style: null }
    });
    expect(prompt).toEqual({
      positive: { content: "a cat", setting: "", style: "", references: "" },
      negative: ""
    });
  });

  it("returns null without a usable positive", () => {
    expect(toStructuredPrompt(null)).toBeNull();
    expect(toStructuredPrompt({ negative: "night" })).toBeNull();
    expect(toStructuredPrompt({ positive: ["a"] })).toBeNull();
  });

  // An empty shell must read as a parse failure so the caller retries, rather
  // than persisting a blank caption that can never be regenerated.
  it("rejects a positive with none of the rendered fields", () => {
    expect(toStructuredPrompt({ positive: {} })).toBeNull();
    expect(toStructuredPrompt({ positive: { content: "  " } })).toBeNull();
    expect(toStructuredPrompt({ positive: "   " })).toBeNull();
    expect(
      toStructuredPrompt({ positive: { references: "Sargent" }, negative: "x" })
    ).toBeNull();
  });

  it("keeps a positive carrying only setting or only style", () => {
    expect(toStructuredPrompt({ positive: { setting: "a street" } })).toEqual({
      positive: { content: "", setting: "a street", style: "", references: "" },
      negative: ""
    });
    expect(
      toStructuredPrompt({ positive: { action: "she walks" } })?.positive
        .content
    ).toBe("she walks");
  });
});

describe("readCachedPrompt", () => {
  it("accepts a previously persisted structured prompt", () => {
    const stored = {
      positive: {
        content: "a cat",
        setting: "",
        style: "oil painting",
        references: ""
      },
      negative: "night"
    };
    expect(readCachedPrompt(stored)).toEqual(stored);
  });

  it("accepts a bare string, as the cloud sometimes stored", () => {
    expect(readCachedPrompt("a cat")?.positive.content).toBe("a cat");
  });

  it("treats an empty shell as absent so the asset gets captioned", () => {
    expect(
      readCachedPrompt({
        positive: { content: "", setting: "", style: "", references: "" },
        negative: ""
      })
    ).toBeNull();
    expect(readCachedPrompt({})).toBeNull();
    expect(readCachedPrompt("")).toBeNull();
    expect(readCachedPrompt(null)).toBeNull();
    expect(readCachedPrompt(undefined)).toBeNull();
    expect(readCachedPrompt([{ positive: "a cat" }])).toBeNull();
  });
});

describe("toPositivePrompt", () => {
  it("reads the single-string positive the AutoPrompt templates ask for", () => {
    expect(toPositivePrompt({ positive: " a cat, oil painting " })).toBe(
      "a cat, oil painting"
    );
  });

  it("falls back to positive.content when the model nests it", () => {
    expect(toPositivePrompt({ positive: { content: "a cat" } })).toBe("a cat");
  });

  it("returns null when there is nothing usable", () => {
    expect(toPositivePrompt(null)).toBeNull();
    expect(toPositivePrompt({ positive: "" })).toBeNull();
    expect(toPositivePrompt({ positive: {} })).toBeNull();
  });
});
