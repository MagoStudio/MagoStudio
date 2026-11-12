export const resolveVoiceDisplayName = (voice: {
  voice_id: string;
  name?: string | null;
}): string => voice.name || voice.voice_id;
