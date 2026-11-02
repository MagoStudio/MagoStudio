"use client";

import { PlayButton } from "@components/PlayButton";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { projectTimelinePlayingAtom } from "../atoms";

interface ProjectTimelinePlayButtonProps {
  totalDurationFrames: number;
}

export function ProjectTimelinePlayButton({
  totalDurationFrames
}: ProjectTimelinePlayButtonProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useAtom(projectTimelinePlayingAtom);
  const isDisabled = totalDurationFrames <= 0;

  const handlePlayToggle = () => {
    if (isDisabled) return;
    setIsPlaying(!isPlaying);
  };

  return (
    <PlayButton
      aria-label={
        isPlaying
          ? t("projectTimeline.pause.label")
          : t("projectTimeline.play.label")
      }
      variant="standalone"
      isPlaying={isPlaying}
      isDisabled={isDisabled}
      onPress={handlePlayToggle}
      className="w-20 h-9 shrink-0 bg-element-additional-active text-glyph-primary-on-pic"
    />
  );
}
