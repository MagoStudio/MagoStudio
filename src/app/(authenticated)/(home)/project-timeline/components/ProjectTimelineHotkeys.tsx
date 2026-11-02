"use client";

import { activeHotkeyAtom } from "@store/atoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import { projectTimelineFrameAtom, projectTimelinePlayingAtom } from "../atoms";

interface ProjectTimelineHotkeysProps {
  totalDurationFrames: number;
}

export function ProjectTimelineHotkeys({
  totalDurationFrames
}: ProjectTimelineHotkeysProps) {
  const [isPlaying, setIsPlaying] = useAtom(projectTimelinePlayingAtom);
  const setCurrentFrame = useSetAtom(projectTimelineFrameAtom);
  const activeScope = useAtomValue(activeHotkeyAtom);
  const isDisabled = totalDurationFrames <= 0;

  useHotkeys(
    "space",
    (event) => {
      event.preventDefault();
      if (isDisabled) return;
      setIsPlaying(!isPlaying);
    },
    { enableOnFormTags: false, enabled: activeScope === "projectView" },
    [isPlaying, isDisabled, activeScope]
  );

  useHotkeys(
    "right",
    (event) => {
      event.preventDefault();
      if (isPlaying) return;
      setCurrentFrame((prev) => Math.min(prev + 1, totalDurationFrames - 1));
    },
    { enableOnFormTags: false, enabled: activeScope === "projectView" },
    [isPlaying, totalDurationFrames, activeScope]
  );

  useHotkeys(
    "left",
    (event) => {
      event.preventDefault();
      if (isPlaying) return;
      setCurrentFrame((prev) => Math.max(prev - 1, 0));
    },
    { enableOnFormTags: false, enabled: activeScope === "projectView" },
    [isPlaying, activeScope]
  );

  return null;
}
