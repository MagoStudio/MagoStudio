import {
  type CrossviewCameraGlyph as CrossviewCameraGlyphGeometry,
  type ScreenPoint
} from "./utils/buildCrossviewCameraViewGeometry";

const asSvgPoints = (points: ScreenPoint[]): string =>
  points.map((point) => `${point.x},${point.y}`).join(" ");

export const CrossviewCameraGlyph = ({
  glyph,
  colorClassName,
  lensFillClassName,
  lensFillOpacity
}: {
  glyph: CrossviewCameraGlyphGeometry;
  colorClassName: string;
  lensFillClassName: string;
  lensFillOpacity: number;
}) => (
  <g className={colorClassName}>
    {glyph.lensCorners.map((corner) => (
      <line
        key={`${corner.x},${corner.y}`}
        x1={glyph.apex.x}
        y1={glyph.apex.y}
        x2={corner.x}
        y2={corner.y}
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
      />
    ))}
    <polygon
      points={asSvgPoints(glyph.lensCorners)}
      className={lensFillClassName}
      fillOpacity={lensFillOpacity}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <polygon
      points={asSvgPoints(glyph.upMarker)}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="round"
    />
    <circle cx={glyph.apex.x} cy={glyph.apex.y} r={2.5} fill="currentColor" />
  </g>
);
