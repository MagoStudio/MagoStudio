import { CropCorner } from "@domains/renders/utils/cropRect";
import { cn } from "@utils";
import { useTranslation } from "react-i18next";

const CORNER_POSITION_CLASSES: Record<string, string> = {
  topLeft: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  bottomRight:
    "left-full top-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  topRight:
    "left-full top-0 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  bottomLeft:
    "left-0 top-full -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"
};

const CORNER_LABEL_KEYS: Record<CropCorner, string> = {
  topLeft: "actions.resize_crop_top_left.label",
  topRight: "actions.resize_crop_top_right.label",
  bottomLeft: "actions.resize_crop_bottom_left.label",
  bottomRight: "actions.resize_crop_bottom_right.label"
};

interface CropHandleProps {
  corner: CropCorner;
  sizePx: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export const CropHandle: React.FC<CropHandleProps> = ({
  corner,
  sizePx,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="presentation"
      aria-label={t(CORNER_LABEL_KEYS[corner])}
      data-testid={`crop-handle-${corner}`}
      className={cn(
        "absolute rounded-full bg-glyph-primary-on-pic touch-none pointer-events-auto",
        CORNER_POSITION_CLASSES[corner]
      )}
      style={{ width: sizePx, height: sizePx }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    />
  );
};
