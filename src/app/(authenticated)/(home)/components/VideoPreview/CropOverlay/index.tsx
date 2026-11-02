import { PERCENTAGE_MULTIPLIER } from "@constants";
import { CropCorner } from "@domains/renders/utils/cropRect";
import { getInputVideoDimensions } from "@domains/renders/utils/getInputVideoDimensions";
import { isCropCapableEngine } from "@domains/renders/utils/isCropCapableEngine";
import { Layer } from "@schemas/layer";
import { viewportPanZoomAtom } from "@store/atoms";
import { useShotCrop } from "@store/cropStore";
import { useRenderSettingsAtoms } from "@store/renderSettingsStore";
import { computeObjectContainBox } from "@utils/video/computeObjectContainBox";
import { useAtomValue } from "jotai";
import { useRef } from "react";

import { useCropCornerDrag } from "../hooks/useCropCornerDrag";

import { CropHandle } from "./CropHandle";

const CROP_BORDER_WIDTH_PX = 2;
const CROP_RADIUS_PX = 4;
const CROP_HANDLE_SIZE_PX = 16;

const CROP_CORNERS: CropCorner[] = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight"
];

interface CropOverlayProps {
  selectedTrack: Layer;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({ selectedTrack }) => {
  const contentBoxRef = useRef<HTMLDivElement>(null);
  const { crop, isCropToolActive, setCrop } = useShotCrop();
  const { selectedModelAtom } = useRenderSettingsAtoms();
  const selectedModel = useAtomValue(selectedModelAtom);
  const viewport = useAtomValue(viewportPanZoomAtom);
  const { inputVideoWidth, inputVideoHeight } =
    getInputVideoDimensions(selectedTrack);

  const {
    onCornerPointerDown,
    onCornerPointerMove,
    onCornerPointerUp,
    onCornerPointerCancel
  } = useCropCornerDrag({
    crop: crop ?? { x: 0, y: 0, width: 1, height: 1 },
    setCrop,
    contentBoxRef
  });

  const shouldRender =
    isCropToolActive &&
    !!crop &&
    isCropCapableEngine(selectedModel.name) &&
    !!inputVideoWidth &&
    !!inputVideoHeight;

  if (!shouldRender) return null;

  const contentBox = computeObjectContainBox({
    containerWidth: viewport.viewportWidth,
    containerHeight: viewport.viewportHeight,
    mediaWidth: inputVideoWidth,
    mediaHeight: inputVideoHeight
  });

  const strokeWidthPx = CROP_BORDER_WIDTH_PX / viewport.zoom;
  const radiusPx = CROP_RADIUS_PX / viewport.zoom;
  const handleSizePx = CROP_HANDLE_SIZE_PX / viewport.zoom;

  return (
    <div
      ref={contentBoxRef}
      className="absolute pointer-events-none"
      style={{
        left: contentBox.left,
        top: contentBox.top,
        width: contentBox.width,
        height: contentBox.height
      }}
    >
      <div
        data-testid="crop-overlay"
        className="absolute border-glyph-primary-on-pic pointer-events-none"
        style={{
          left: `${crop.x * PERCENTAGE_MULTIPLIER}%`,
          top: `${crop.y * PERCENTAGE_MULTIPLIER}%`,
          width: `${crop.width * PERCENTAGE_MULTIPLIER}%`,
          height: `${crop.height * PERCENTAGE_MULTIPLIER}%`,
          borderWidth: strokeWidthPx,
          borderRadius: radiusPx
        }}
      >
        {CROP_CORNERS.map((corner) => (
          <CropHandle
            key={corner}
            corner={corner}
            sizePx={handleSizePx}
            onPointerDown={onCornerPointerDown(corner)}
            onPointerMove={onCornerPointerMove}
            onPointerUp={onCornerPointerUp}
            onPointerCancel={onCornerPointerCancel}
          />
        ))}
      </div>
    </div>
  );
};
