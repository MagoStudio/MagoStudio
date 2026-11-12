import { MainButton } from "@components/MainButton";
import { Text } from "@components/Text";
import { formatStockVoiceTags } from "@domains/voiceLibrary/utils/formatStockVoiceTags";
import { resolveVoiceDisplayName } from "@domains/voiceLibrary/utils/resolveVoiceDisplayName";
import { VoiceSignature } from "@schemas/scriptProject";
import { useTranslation } from "react-i18next";

import { CharacterVoicePlayButton } from "./CharacterVoicePlayButton";

type Props = {
  token: string;
  voiceSignature: VoiceSignature | null | undefined;
  onOpenVoiceDialog: () => void;
};

export const CharacterVoiceCard: React.FC<Props> = ({
  token,
  voiceSignature,
  onOpenVoiceDialog
}) => {
  const { t } = useTranslation();
  const voiceTagsLine = formatStockVoiceTags(voiceSignature?.tags ?? []);

  return (
    <section
      className="flex min-w-0 flex-1 flex-col justify-between gap-3 rounded-xl border border-element-primary bg-surface-primary p-3"
      aria-label={t("script_project.voice.title")}
      data-testid={`sheet-group-voice-card-${token}`}
    >
      <Text component="h4" variant="xs" weight="semibold">
        {t("script_project.voice.title")}
      </Text>
      {voiceSignature ? (
        <div className="flex items-start gap-2">
          <CharacterVoicePlayButton
            key={voiceSignature.voice_id}
            voicePreviewSource={{
              voiceId: voiceSignature.voice_id,
              providerPreviewUrl: voiceSignature.preview_url
            }}
            testId={`sheet-group-play-voice-${token}`}
          />
          <div className="flex min-w-0 flex-col">
            <Text variant="sm" weight="semibold" className="truncate">
              {resolveVoiceDisplayName(voiceSignature)}
            </Text>
            {voiceTagsLine && (
              <Text variant="2xs" color="glyph-tertiary">
                {voiceTagsLine}
              </Text>
            )}
          </div>
        </div>
      ) : (
        <Text variant="xs" color="glyph-tertiary">
          {t("script_project.voice.no_voice_chosen")}
        </Text>
      )}
      <div className="self-start">
        <MainButton
          size="sm"
          colorScheme="secondary"
          onPress={onOpenVoiceDialog}
          data-testid={`sheet-group-add-voice-${token}`}
        >
          {t(
            voiceSignature
              ? "script_project.voice.edit_voice_button.label"
              : "script_project.voice.add_voice_button.label"
          )}
        </MainButton>
      </div>
    </section>
  );
};
