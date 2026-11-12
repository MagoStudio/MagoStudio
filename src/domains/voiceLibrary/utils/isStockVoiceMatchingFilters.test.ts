import { describe, expect, it } from "vitest";

import { isStockVoiceMatchingFilters } from "./isStockVoiceMatchingFilters";

const oldMaleVoice = { tags: ["old", "male", "british", "calm"] };
const childFemaleVoice = { tags: ["child", "female", "american"] };

describe("isStockVoiceMatchingFilters", () => {
  it("matches every voice when no filter is chosen", () => {
    expect(
      isStockVoiceMatchingFilters(oldMaleVoice, {
        genderFilterKey: "all",
        ageFilterKey: "all"
      })
    ).toBe(true);
  });

  it("matches the gender against the provider's gender tag", () => {
    expect(
      isStockVoiceMatchingFilters(oldMaleVoice, {
        genderFilterKey: "male",
        ageFilterKey: "all"
      })
    ).toBe(true);
    expect(
      isStockVoiceMatchingFilters(childFemaleVoice, {
        genderFilterKey: "male",
        ageFilterKey: "all"
      })
    ).toBe(false);
  });

  it("maps Kids to the child tag and Elderly to the old tag", () => {
    expect(
      isStockVoiceMatchingFilters(childFemaleVoice, {
        genderFilterKey: "all",
        ageFilterKey: "kids"
      })
    ).toBe(true);
    expect(
      isStockVoiceMatchingFilters(oldMaleVoice, {
        genderFilterKey: "all",
        ageFilterKey: "elderly"
      })
    ).toBe(true);
    expect(
      isStockVoiceMatchingFilters(oldMaleVoice, {
        genderFilterKey: "all",
        ageFilterKey: "kids"
      })
    ).toBe(false);
  });

  it("does not treat a female voice as male because the word contains it", () => {
    expect(
      isStockVoiceMatchingFilters(
        { tags: ["young", "female"] },
        { genderFilterKey: "male", ageFilterKey: "all" }
      )
    ).toBe(false);
  });
});
