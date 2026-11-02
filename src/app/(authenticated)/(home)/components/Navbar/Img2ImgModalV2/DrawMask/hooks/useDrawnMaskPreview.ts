import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

import { Seedream5ProType } from "../../schemas/seedream5Pro.schema";
import { compositeMask } from "../utils/compositeMask";
import { isDrawnMaskOnFrame } from "../utils/isDrawnMaskOnFrame";

export const useDrawnMaskPreview = (currentFrame: number): string | null => {
  const maskLayerDataUrl = useWatch<Seedream5ProType, "maskLayerDataUrl">({
    name: "maskLayerDataUrl"
  });
  const maskedFrameSrc = useWatch<Seedream5ProType, "maskedFrameSrc">({
    name: "maskedFrameSrc"
  });
  const maskFrameIdx = useWatch<Seedream5ProType, "maskFrameIdx">({
    name: "maskFrameIdx"
  });

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const isOnMaskedFrame = isDrawnMaskOnFrame({
    maskFrameIdx,
    maskedFrameSrc,
    maskLayerDataUrl,
    currentFrame
  });

  /* eslint-disable react-you-might-not-need-an-effect/no-adjust-state-on-prop-change -- async canvas composite into state, not derivable in render */
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- async canvas composite into state
  useEffect(() => {
    if (!isOnMaskedFrame || !maskedFrameSrc || !maskLayerDataUrl) {
      setPreviewSrc(null);
      return;
    }
    let cancelled = false;
    compositeMask(maskedFrameSrc, maskLayerDataUrl)
      .then((src) => {
        if (!cancelled) {
          setPreviewSrc(src);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewSrc(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOnMaskedFrame, maskedFrameSrc, maskLayerDataUrl]);
  /* eslint-enable react-you-might-not-need-an-effect/no-adjust-state-on-prop-change */

  return previewSrc;
};
