const AUDIO_REFERENCE_TAG = /<Audio \d+>/g;

export const nameUnwiredSoundtrackInPrompt = (prompt: string): string =>
  prompt.replace(AUDIO_REFERENCE_TAG, "the soundtrack");
