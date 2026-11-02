import { PERCENTAGE_MULTIPLIER } from "@constants";
import { NormalizedCropRect } from "@domains/renders/utils/cropRect";
import { cn } from "@utils";

const CROP_SCRIM_COLOR = "rgba(0, 0, 0, 0.4)";
const CROP_BORDER_WIDTH_PX = 2;
const CROP_RADIUS_PX = 4;
const CROP_DOT_SIZE_PX = 8;

const CROP_CORNERS = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight"
] as const;

const CORNER_POSITION_CLASSES: Record<(typeof CROP_CORNERS)[number], string> = {
  topLeft: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
  topRight: "left-full top-0 -translate-x-1/2 -translate-y-1/2",
  bottomLeft: "left-0 top-full -translate-x-1/2 -translate-y-1/2",
  bottomRight: "left-full top-full -translate-x-1/2 -translate-y-1/2"
};

interface Img2ImgCropOverlayProps {
  crop: NormalizedCropRect;
}

export const Img2ImgCropOverlay: React.FC<Img2ImgCropOverlayProps> = ({
  crop
}) => (
  <div
    data-testid="img2img-crop-overlay"
    className="pointer-events-none absolute inset-0 overflow-hidden"
  >
    <div
      className="absolute border-glyph-primary-on-pic"
      style={{
        left: `${crop.x * PERCENTAGE_MULTIPLIER}%`,
        top: `${crop.y * PERCENTAGE_MULTIPLIER}%`,
        width: `${crop.width * PERCENTAGE_MULTIPLIER}%`,
        height: `${crop.height * PERCENTAGE_MULTIPLIER}%`,
        borderWidth: CROP_BORDER_WIDTH_PX,
        borderRadius: CROP_RADIUS_PX,
        boxShadow: `0 0 0 9999px ${CROP_SCRIM_COLOR}`
      }}
    >
      {CROP_CORNERS.map((corner) => (
        <div
          key={corner}
          className={cn(
            "absolute rounded-full bg-glyph-primary-on-pic",
            CORNER_POSITION_CLASSES[corner]
          )}
          style={{ width: CROP_DOT_SIZE_PX, height: CROP_DOT_SIZE_PX }}
        />
      ))}
    </div>
  </div>
);
