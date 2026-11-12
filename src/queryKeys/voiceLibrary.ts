export const voiceLibrary = {
  all: ["voiceLibrary"] as const,
  byLanguageCode: (languageCode: string) =>
    [...voiceLibrary.all, languageCode] as const
};

export const voicePreviewUrl = {
  all: ["voicePreviewUrl"] as const,
  byVoiceId: (voiceId: string) => [...voicePreviewUrl.all, voiceId] as const
};
