import { trackingWithProjectId } from "@hooks/tracking/trackingUtils";
import { useLocalStorageProjectSettings } from "@hooks/userLocalStorage/useLocalStorageProjectSettings";
import { getDefaultRenderFrames } from "@models/video/types";
import { isPlayingAtom } from "@store/atoms";
import { trackRangeAtom } from "@store/atoms/trackRangeAtom";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useAtomValue, useSetAtom } from "jotai";
import { debounce } from "lodash";
import { useEffect, useMemo, useRef } from "react";

import { clampRangeToMaxLength } from "./clampRangeToMaxLength";
import { clampRangeToMinLength } from "./clampRangeToMinLength";
import { clampRangeToShotLength } from "./clampRangeToShotLength";

const SAVE_DEBOUNCE_DELAY_MS = 1000;
const DEFAULT_START_FRAME = 0;

interface UseRangeSideEffectsProps {
  shotMaxFrames: number;
  selectedProjectId?: string;
  selectedShotId?: string;
  onRangeChange: (range: [number, number]) => void;
  minRangeLength: number;
  maxRangeLength: number;
  isInterpolationEnabled: boolean;
  isUnlimitedModeActive: boolean;
  planMaxFrameRange: number | undefined;
  fps: number;
}

export const useRangeSideEffects = ({
  shotMaxFrames,
  selectedProjectId,
  selectedShotId,
  onRangeChange,
  minRangeLength,
  maxRangeLength,
  isInterpolationEnabled,
  isUnlimitedModeActive,
  planMaxFrameRange,
  fps
}: UseRangeSideEffectsProps) => {
  const setIsPlaying = useSetAtom(isPlayingAtom);

  const trackRange = useAtomValue(trackRangeAtom);
  const setTrackRange = useSetAtom(trackRangeAtom);
  const [rangeMinFr, rangeMaxFr] = trackRange;
  const { projectSettings, setProjectSettings } =
    useLocalStorageProjectSettings(selectedProjectId, selectedShotId);
  // eslint-disable-next-line no-restricted-syntax -- debounce is a stateful external function; a stable reference is required so the effect cleanup cancels the same timer it scheduled
  const saveTrackRange = useMemo(
    () =>
      debounce((trackRange: [number, number]) => {
        if (!selectedProjectId) return;
        if (!trackRange) return;

        setProjectSettings({
          rangeMin: trackRange[0],
          rangeMax: trackRange[1]
        });
        trackingWithProjectId.timelineActions.rangeSelector(
          trackRange,
          selectedProjectId
        );
      }, SAVE_DEBOUNCE_DELAY_MS),
    [selectedProjectId, setProjectSettings]
  );
  const { selectedModelAtom } = useRenderSettingsAtoms();
  const selectedModel = useAtomValue(selectedModelAtom);
  const defaultRangeMax = getDefaultRenderFrames(
    selectedModel.renderDurationLimits.defaultFrameRange,
    fps
  );

  const constrainedDefaultMax =
    shotMaxFrames > 0
      ? Math.min(defaultRangeMax, shotMaxFrames)
      : defaultRangeMax;

  const savedMinFr = Number(projectSettings?.rangeMin ?? DEFAULT_START_FRAME);
  const savedMaxFr = Number(projectSettings?.rangeMax ?? constrainedDefaultMax);

  const hasInitialised = useRef(false);
  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: seeds the shared trackRangeAtom from localStorage once, before any user interaction exists to hang this off
  useEffect(() => {
    if (hasInitialised.current) return;
    const isInitialisation = trackRange[0] === 0 && trackRange[1] === 0;
    if (isInitialisation) {
      hasInitialised.current = true;
      setTrackRange([savedMinFr, savedMaxFr]);
    }
  }, [savedMinFr, savedMaxFr, setTrackRange, trackRange]);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: re-seeds the shared trackRangeAtom when the project or its stored range changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setTrackRange([savedMinFr, savedMaxFr]);
  }, [selectedProjectId, savedMinFr, savedMaxFr, setTrackRange]);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: debounced localStorage write plus analytics, with cleanup that cancels the pending timer
  useEffect(() => {
    if (rangeMinFr === 0 && rangeMaxFr === 0) return;
    saveTrackRange(trackRange);
    setIsPlaying(false);

    return () => {
      saveTrackRange.cancel();
    };
  }, [trackRange, saveTrackRange, setIsPlaying, rangeMinFr, rangeMaxFr]);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: clamps the shared trackRangeAtom up to the model's minimum once limits resolve
  useEffect(() => {
    if (!selectedProjectId) return;

    const clampedRange = clampRangeToMinLength({
      rangeMin: rangeMinFr,
      rangeMax: rangeMaxFr,
      minRangeLength,
      shotMaxFrames
    });

    if (!clampedRange) return;

    onRangeChange(clampedRange);
    trackingWithProjectId.timelineActions.rangeSelector(
      clampedRange,
      selectedProjectId
    );
  }, [
    isUnlimitedModeActive,
    isInterpolationEnabled,
    selectedProjectId,
    rangeMinFr,
    rangeMaxFr,
    minRangeLength,
    shotMaxFrames,
    onRangeChange,
    selectedModel
  ]);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: clamps the shared trackRangeAtom down to the model's maximum once limits resolve
  useEffect(() => {
    if (!selectedProjectId) return;

    const clampedRange = clampRangeToMaxLength({
      rangeMin: rangeMinFr,
      rangeMax: rangeMaxFr,
      maxRangeLength,
      shotMaxFrames
    });

    if (!clampedRange) return;

    onRangeChange(clampedRange);
    trackingWithProjectId.timelineActions.rangeSelector(
      clampedRange,
      selectedProjectId
    );
  }, [
    isUnlimitedModeActive,
    isInterpolationEnabled,
    selectedProjectId,
    rangeMinFr,
    rangeMaxFr,
    shotMaxFrames,
    maxRangeLength,
    onRangeChange,
    selectedModel,
    planMaxFrameRange
  ]);

  // oxlint-disable-next-line custom-react/no-use-effect -- external sync: clamps the shared trackRangeAtom to the shot length once the asset duration resolves
  useEffect(() => {
    if (!selectedProjectId) return;

    const clampedRange = clampRangeToShotLength({
      rangeMin: rangeMinFr,
      rangeMax: rangeMaxFr,
      shotMaxFrames
    });

    if (!clampedRange) return;

    onRangeChange(clampedRange);
    trackingWithProjectId.timelineActions.rangeSelector(
      clampedRange,
      selectedProjectId
    );
  }, [selectedProjectId, rangeMinFr, rangeMaxFr, shotMaxFrames, onRangeChange]);
};
