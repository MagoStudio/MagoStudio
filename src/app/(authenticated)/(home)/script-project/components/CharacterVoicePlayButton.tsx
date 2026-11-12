import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import {
  usePlayVoicePreview,
  VoicePreviewSource
} from "@domains/voiceLibrary/usePlayVoicePreview";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  voicePreviewSource: VoicePreviewSource;
  testId: string;
};

export const CharacterVoicePlayButton: React.FC<Props> = ({
  voicePreviewSource,
  testId
}) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playVoicePreview, stopVoicePreview } = usePlayVoicePreview();
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  const stopVoice = (audio: HTMLAudioElement) => {
    stopVoicePreview(audio);
    setIsVoicePlaying(false);
  };

  const playVoice = async (audio: HTMLAudioElement) => {
    setIsVoicePlaying(true);
    const isVoiceNowPlaying = await playVoicePreview(audio, voicePreviewSource);
    setIsVoicePlaying(isVoiceNowPlaying);
  };

  const toggleVoice = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isVoicePlaying) {
      stopVoice(audio);
      return;
    }
    void playVoice(audio);
  };

  return (
    <>
      <IconActionButton
        size="xs"
        variant="transparent"
        icon={
          <Icon iconSet="16" iconName={isVoicePlaying ? "stop" : "volume-up"} />
        }
        aria-label={t(
          isVoicePlaying
            ? "script_project.voice.stop_voice_button.ariaLabel"
            : "script_project.voice.play_voice_button.ariaLabel"
        )}
        aria-pressed={isVoicePlaying}
        onPress={toggleVoice}
        data-testid={testId}
      />
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setIsVoicePlaying(false)}
      />
    </>
  );
};
