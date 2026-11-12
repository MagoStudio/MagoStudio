import { VoiceSignature } from "@schemas/scriptProject";
import { StockVoice } from "@schemas/voiceLibrary";

const STOCK_VOICE_PROVIDER = "elevenlabs";

export const buildVoiceSignatureFromStockVoice = (
  stockVoice: StockVoice
): VoiceSignature => ({
  provider: STOCK_VOICE_PROVIDER,
  voice_id: stockVoice.voice_id,
  name: stockVoice.name ?? null,
  tags: stockVoice.tags,
  preview_url: stockVoice.preview_url ?? null
});
