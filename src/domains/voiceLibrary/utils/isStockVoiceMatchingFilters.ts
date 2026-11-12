export const ALL_VOICE_GENDERS_FILTER_KEY = "all";
export const ALL_VOICE_AGES_FILTER_KEY = "all";

const PROVIDER_AGE_TAG_BY_AGE_FILTER_KEY: Record<string, string> = {
  kids: "child",
  elderly: "old"
};

export const isStockVoiceMatchingFilters = (
  stockVoice: { tags: string[] },
  {
    genderFilterKey,
    ageFilterKey
  }: { genderFilterKey: string; ageFilterKey: string }
): boolean => {
  const isOfSelectedGender =
    genderFilterKey === ALL_VOICE_GENDERS_FILTER_KEY ||
    stockVoice.tags.includes(genderFilterKey);
  const providerAgeTag = PROVIDER_AGE_TAG_BY_AGE_FILTER_KEY[ageFilterKey];
  const isOfSelectedAge =
    ageFilterKey === ALL_VOICE_AGES_FILTER_KEY ||
    (!!providerAgeTag && stockVoice.tags.includes(providerAgeTag));
  return isOfSelectedGender && isOfSelectedAge;
};
