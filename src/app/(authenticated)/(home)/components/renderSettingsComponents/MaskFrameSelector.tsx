import { FrameScrubber } from "@components/FrameScrubber";
import {
  parseMaskPoints,
  serializeMaskPoints
} from "@domains/sam/utils/parseMaskPoints";
import { useInputTrack } from "@domains/track/useInputTrack";
import {
  frameRangeOf,
  toOutputFrame,
  toSourceFrame
} from "@domains/track/utils/frameCoordinates";
import { MaskPointMarkers } from "@home/components/renderSettingsComponents/MaskPointMarkers";
import { currentVideoFrameAtom } from "@store/atoms";
import { MaskPreviewPoint } from "@store/maskPreviewStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { useToast } from "@store/useToast";
import { useAtomValue, useSetAtom } from "jotai";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

type FrameSnapshot = {
  maskFrameIdx: number;
  points: MaskPreviewPoint[];
};

export const MaskFrameSelector: React.FC = () => {
  const { t } = useTranslation();
  const { renderSettingsValuesAtom, updateValueAtom } =
    useRenderSettingsAtoms();
  const renderSettings = useAtomValue(renderSettingsValuesAtom);
  const updateValue = useSetAtom(updateValueAtom);
  const { showToast } = useToast();
  const setCurrentVideoFrame = useSetAtom(currentVideoFrameAtom);

  const { inputTrack } = useInputTrack();
  const [minFrame, maxFrame] = inputTrack ? frameRangeOf(inputTrack) : [0, 0];
  const timelineOffset = minFrame;

  const maskFrameIdx =
    (renderSettings?.mask_frame_idx as number | undefined) ?? 0;
  const points = parseMaskPoints(
    renderSettings?.mask_visual_selection as string | undefined
  );
  const hasPoints = points.length > 0;

  const currentFrame = toSourceFrame({
    outputFrame: maskFrameIdx,
    offset: timelineOffset
  });

  const snapshotRef = useRef<FrameSnapshot | null>(null);
  const toastIdRef = useRef<string | null>(null);

  const writeFrame = (nextFrame: number) => {
    const nextMaskFrameIdx = toOutputFrame({
      sourceFrame: nextFrame,
      offset: timelineOffset
    });
    updateValue({ key: "mask_frame_idx", value: nextMaskFrameIdx });
  };

  const writePoints = (nextPoints: MaskPreviewPoint[]) => {
    updateValue({
      key: "mask_visual_selection",
      value: serializeMaskPoints(nextPoints)
    });
  };

  const restoreSnapshot = () => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    updateValue({ key: "mask_frame_idx", value: snapshot.maskFrameIdx });
    writePoints(snapshot.points);
    setCurrentVideoFrame(
      toSourceFrame({
        outputFrame: snapshot.maskFrameIdx,
        offset: timelineOffset
      })
    );
    snapshotRef.current = null;
    toastIdRef.current = null;
  };

  const acceptCleared = () => {
    snapshotRef.current = null;
    toastIdRef.current = null;
  };

  const handleSetFrame = (nextFrame: number) => {
    if (nextFrame === currentFrame) return;

    if (!hasPoints) {
      writeFrame(nextFrame);
      setCurrentVideoFrame(nextFrame);
      return;
    }

    if (!snapshotRef.current) {
      snapshotRef.current = { maskFrameIdx, points };
    }

    writeFrame(nextFrame);
    writePoints([]);
    setCurrentVideoFrame(nextFrame);

    if (toastIdRef.current) return;

    toastIdRef.current = showToast({
      message: t("masking.frame_warning_toast.title.label"),
      onSubmitText: t("masking.frame_warning_toast.undo.label"),
      onSubmit: restoreSnapshot,
      onCancelText: t("masking.frame_warning_toast.start_new.label"),
      onCancel: acceptCleared,
      onClose: acceptCleared,
      autoDismiss: false,
      showTimer: false,
      invertedSubmitAndCancelColors: false
    });
  };

  return (
    <FrameScrubber
      currentFrame={currentFrame}
      setCurrentFrame={handleSetFrame}
      minFrame={minFrame}
      maxFrame={maxFrame}
      overlay={<MaskPointMarkers points={points} />}
    />
  );
};
