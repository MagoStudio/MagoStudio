import type { MaskPreviewPoint } from "@store/maskPreviewStore";

const PERCENT = 100;

interface MaskPointMarkersProps {
  points: MaskPreviewPoint[];
}

export const MaskPointMarkers: React.FC<MaskPointMarkersProps> = ({
  points
}) => (
  <div className="pointer-events-none absolute inset-0">
    {points.map((point, i) => (
      <div
        key={i}
        data-testid="mask-point-marker"
        className="absolute"
        style={{
          left: `${point.x * PERCENT}%`,
          top: `${point.y * PERCENT}%`,
          transform: "translate(-50%, -50%)"
        }}
      >
        <div className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-white">
          <div className="absolute h-px w-3 bg-black" />
          {point.label === 1 && <div className="absolute h-3 w-px bg-black" />}
        </div>
      </div>
    ))}
  </div>
);
