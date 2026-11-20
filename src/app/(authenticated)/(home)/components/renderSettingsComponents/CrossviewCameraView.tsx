import { Text } from "@components/Text";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { resolveMiniMaxH3CrossviewCamera } from "../../../../../../desktop/shared/minimaxH3VfxModes";

import { CrossviewCameraGlyph } from "./CrossviewCameraGlyph";
import { RenderSettingComponentProps } from "./interface";
import {
  buildCrossviewCameraViewGeometry,
  CROSSVIEW_CAMERA_VIEW_HEIGHT,
  CROSSVIEW_CAMERA_VIEW_WIDTH,
  CROSSVIEW_REACHABLE_BAND,
  type ScreenPoint,
  screenPointToOrbitAngles
} from "./utils/buildCrossviewCameraViewGeometry";

const asSvgPoints = (points: ScreenPoint[]): string =>
  points.map((point) => `${point.x},${point.y}`).join(" ");

const GRID_LINE_OPACITY = 0.3;
const GRID_LINE_WIDTH = 0.75;
const BAND_EDGE_OPACITY = 0.7;
const BAND_EDGE_WIDTH = 1;
const SUBJECT_SHADOW_DROP = 4;
const SUBJECT_HALF_WIDTH = 4;
const SUBJECT_TOP_ABOVE_GROUND = 16;
const SUBJECT_EYE_ABOVE_GROUND = 6;
const AZIMUTH_KEYBOARD_STEP_DEGREES = 5;
const ELEVATION_KEYBOARD_STEP_DEGREES = 1;
const HATCH_SPACING = 5;
const LEGEND_SWATCH_WIDTH = 14;
const LEGEND_SWATCH_HEIGHT = 10;
const CHECKED_SWATCH_BORDER = 1.5;
const TRAINED_SWATCH_BORDER = 1;

const keepInsideBand = (value: number, limit: number) =>
  Math.min(limit, Math.max(-limit, value));

export const CrossviewCameraView = ({
  label,
  isDisabled,
  value: azimuthDegrees,
  secondValue: elevationDegrees,
  setValue: setAzimuthDegrees,
  setSecondValue: setElevationDegrees
}: RenderSettingComponentProps<number>) => {
  const { t } = useTranslation();
  const trainedZoneHatchId = `crossview-trained-hatch-${useId()}`;
  const camera = resolveMiniMaxH3CrossviewCamera({
    crossview_azimuth: azimuthDegrees,
    crossview_elevation: elevationDegrees
  });
  const geometry = buildCrossviewCameraViewGeometry(camera);
  const horizontalReadout =
    camera.azimuthDegrees === 0
      ? t("renderSettings.crossviewCameraView.straightOn")
      : t(
          camera.azimuthDegrees < 0
            ? "renderSettings.crossviewCameraView.left"
            : "renderSettings.crossviewCameraView.right",
          { degrees: Math.abs(camera.azimuthDegrees) }
        );
  const verticalReadout =
    camera.elevationDegrees === 0
      ? t("renderSettings.crossviewCameraView.level")
      : t(
          camera.elevationDegrees < 0
            ? "renderSettings.crossviewCameraView.down"
            : "renderSettings.crossviewCameraView.up",
          { degrees: Math.abs(camera.elevationDegrees) }
        );

  const moveCamera = (azimuthDegrees: number, elevationDegrees: number) => {
    const roundedAzimuth = Math.round(
      keepInsideBand(
        azimuthDegrees,
        CROSSVIEW_REACHABLE_BAND.azimuthLimitDegrees
      )
    );
    const roundedElevation = Math.round(
      keepInsideBand(
        elevationDegrees,
        CROSSVIEW_REACHABLE_BAND.elevationLimitDegrees
      )
    );
    if (roundedAzimuth !== camera.azimuthDegrees)
      setAzimuthDegrees(roundedAzimuth);
    if (roundedElevation !== camera.elevationDegrees)
      setElevationDegrees?.(roundedElevation);
  };

  const moveCameraToPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const angles = screenPointToOrbitAngles({
      x:
        ((e.clientX - bounds.left) / bounds.width) *
        CROSSVIEW_CAMERA_VIEW_WIDTH,
      y:
        ((e.clientY - bounds.top) / bounds.height) *
        CROSSVIEW_CAMERA_VIEW_HEIGHT
    });
    moveCamera(angles.azimuthDegrees, angles.elevationDegrees);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDisabled) return;
    e.currentTarget.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    moveCameraToPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const isDraggingCamera =
      !isDisabled && e.currentTarget.hasPointerCapture(e.pointerId);
    if (isDraggingCamera) moveCameraToPointer(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (isDisabled) return;
    const keyboardMoves: Record<string, [number, number]> = {
      ArrowLeft: [-AZIMUTH_KEYBOARD_STEP_DEGREES, 0],
      ArrowRight: [AZIMUTH_KEYBOARD_STEP_DEGREES, 0],
      ArrowUp: [0, ELEVATION_KEYBOARD_STEP_DEGREES],
      ArrowDown: [0, -ELEVATION_KEYBOARD_STEP_DEGREES]
    };
    const move = keyboardMoves[e.key];
    if (!move) return;
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    moveCamera(
      camera.azimuthDegrees + move[0],
      camera.elevationDegrees + move[1]
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Text variant="sm" color="glyph-secondary">
          {label}
        </Text>
        <Text variant="xs" color="glyph-action-main">
          {`${horizontalReadout} · ${verticalReadout}`}
        </Text>
      </div>
      <div className="rounded-lg bg-surface-bg-300 px-2 py-1">
        <svg
          viewBox={`0 0 ${CROSSVIEW_CAMERA_VIEW_WIDTH} ${CROSSVIEW_CAMERA_VIEW_HEIGHT}`}
          role="application"
          tabIndex={isDisabled ? -1 : 0}
          aria-label={t("renderSettings.crossviewCameraView.ariaLabel", {
            horizontal: horizontalReadout,
            vertical: verticalReadout
          })}
          aria-roledescription={t(
            "renderSettings.crossviewCameraView.roleDescription"
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={handleKeyDown}
          className={
            isDisabled
              ? "block w-full touch-none select-none"
              : "block w-full cursor-grab touch-none select-none outline-none active:cursor-grabbing"
          }
        >
          <polygon
            points={asSvgPoints(geometry.ground)}
            className="fill-element-info"
            fillOpacity={0.35}
          />
          <defs>
            <pattern
              id={trainedZoneHatchId}
              width={HATCH_SPACING}
              height={HATCH_SPACING}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={HATCH_SPACING}
                className="stroke-glyph-action-main"
                strokeOpacity={0.55}
                strokeWidth={1.5}
              />
            </pattern>
          </defs>
          <polygon
            points={asSvgPoints(geometry.trainedZone)}
            className="fill-surface-bg-100"
            fillOpacity={0.3}
          />
          <polygon
            points={asSvgPoints(geometry.trainedZone)}
            fill={`url(#${trainedZoneHatchId})`}
            className="stroke-glyph-action-main"
            strokeOpacity={0.6}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <polygon
            points={asSvgPoints(geometry.checkedZone)}
            className="fill-glyph-action-main stroke-glyph-action-main"
            fillOpacity={0.35}
            strokeWidth={1.5}
          />
          {geometry.latitudeLines.map((line) => (
            <polyline
              key={`latitude-${line.elevationDegrees}`}
              points={asSvgPoints(line.points)}
              fill="none"
              className="stroke-glyph-action-main"
              strokeOpacity={
                line.isBandEdge ? BAND_EDGE_OPACITY : GRID_LINE_OPACITY
              }
              strokeWidth={line.isBandEdge ? BAND_EDGE_WIDTH : GRID_LINE_WIDTH}
            />
          ))}
          {geometry.longitudeLines.map((line) => (
            <polyline
              key={`longitude-${line.azimuthDegrees}`}
              points={asSvgPoints(line.points)}
              fill="none"
              className="stroke-glyph-action-main"
              strokeOpacity={
                line.isBandEdge ? BAND_EDGE_OPACITY : GRID_LINE_OPACITY
              }
              strokeWidth={line.isBandEdge ? BAND_EDGE_WIDTH : GRID_LINE_WIDTH}
            />
          ))}
          <ellipse
            cx={geometry.subject.x}
            cy={geometry.subject.y + SUBJECT_SHADOW_DROP}
            rx={10}
            ry={3.5}
            className="fill-glyph-tertiary"
            fillOpacity={0.5}
          />
          <rect
            x={geometry.subject.x - SUBJECT_HALF_WIDTH}
            y={geometry.subject.y - SUBJECT_TOP_ABOVE_GROUND}
            width={8}
            height={20}
            rx={4}
            className="fill-glyph-primary"
          />
          <polyline
            points={asSvgPoints(geometry.orbitPath)}
            fill="none"
            className="stroke-glyph-primary"
            strokeWidth={1.75}
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          <line
            x1={geometry.newCamera.apex.x}
            y1={geometry.newCamera.apex.y}
            x2={geometry.subject.x}
            y2={geometry.subject.y - SUBJECT_EYE_ABOVE_GROUND}
            className="stroke-glyph-primary"
            strokeOpacity={0.45}
            strokeDasharray="2 3"
          />
          <CrossviewCameraGlyph
            glyph={geometry.sourceCamera}
            colorClassName="text-glyph-secondary"
            lensFillClassName="fill-glyph-secondary"
            lensFillOpacity={0.15}
          />
          <CrossviewCameraGlyph
            glyph={geometry.newCamera}
            colorClassName="text-glyph-success"
            lensFillClassName="fill-glyph-success"
            lensFillOpacity={0.85}
          />
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-1">
          <svg
            width={LEGEND_SWATCH_WIDTH}
            height={LEGEND_SWATCH_HEIGHT}
            aria-hidden="true"
          >
            <rect
              x={CHECKED_SWATCH_BORDER / 2}
              y={CHECKED_SWATCH_BORDER / 2}
              width={LEGEND_SWATCH_WIDTH - CHECKED_SWATCH_BORDER}
              height={LEGEND_SWATCH_HEIGHT - CHECKED_SWATCH_BORDER}
              rx={2}
              className="fill-glyph-action-main stroke-glyph-action-main"
              fillOpacity={0.35}
              strokeWidth={CHECKED_SWATCH_BORDER}
            />
          </svg>
          <Text variant="xs" color="glyph-tertiary">
            {t("renderSettings.crossviewCameraView.checkedZone")}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <svg
            width={LEGEND_SWATCH_WIDTH}
            height={LEGEND_SWATCH_HEIGHT}
            aria-hidden="true"
          >
            <rect
              x={TRAINED_SWATCH_BORDER / 2}
              y={TRAINED_SWATCH_BORDER / 2}
              width={LEGEND_SWATCH_WIDTH - TRAINED_SWATCH_BORDER}
              height={LEGEND_SWATCH_HEIGHT - TRAINED_SWATCH_BORDER}
              rx={2}
              fill={`url(#${trainedZoneHatchId})`}
              className="stroke-glyph-action-main"
              strokeOpacity={0.6}
              strokeDasharray="3 2"
            />
          </svg>
          <Text variant="xs" color="glyph-tertiary">
            {t("renderSettings.crossviewCameraView.trainedZone")}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-glyph-success" />
          <Text variant="xs" color="glyph-tertiary">
            {t("renderSettings.crossviewCameraView.newCamera")}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-glyph-secondary" />
          <Text variant="xs" color="glyph-tertiary">
            {t("renderSettings.crossviewCameraView.sourceCamera")}
          </Text>
        </div>
      </div>
    </div>
  );
};
