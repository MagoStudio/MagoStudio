import type { MiniMaxH3CrossviewCamera } from "../../../../../../../desktop/shared/minimaxH3VfxModes";

export const CROSSVIEW_CAMERA_VIEW_WIDTH = 320;
export const CROSSVIEW_CAMERA_VIEW_HEIGHT = 210;

const VIEW_CENTER_X = CROSSVIEW_CAMERA_VIEW_WIDTH / 2;
const VIEW_CENTER_Y = CROSSVIEW_CAMERA_VIEW_HEIGHT / 2;
const ORBIT_RADIUS_PX = 105;
const OBSERVER_PITCH_DEGREES = 10;
const GROUND_RADIUS_RATIO = 1.12;
const GROUND_SEGMENTS = 48;
const CURVE_STEP_DEGREES = 3;
const ORBIT_PATH_SEGMENTS = 24;
const CAMERA_LENS_DEPTH = 0.3;
const CAMERA_LENS_HALF_WIDTH = 0.15;
const CAMERA_LENS_HALF_HEIGHT = 0.1;
const CAMERA_UP_MARKER_GAP = 0.03;
const CAMERA_UP_MARKER_HALF_WIDTH = 0.07;
const CAMERA_UP_MARKER_HEIGHT = 0.09;

export const CROSSVIEW_REACHABLE_BAND = {
  azimuthLimitDegrees: 90,
  elevationLimitDegrees: 45
} as const;

const GRID_ELEVATION_STEP_DEGREES = 15;
const GRID_AZIMUTH_STEP_DEGREES = 30;
const DEGREES_PER_HALF_TURN = 180;
const DEGREES_PER_TURN = 360;

const symmetricSteps = (limit: number, step: number): number[] =>
  Array.from(
    { length: (2 * limit) / step + 1 },
    (_unused, index) => -limit + index * step
  );

export type CrossviewCoverageZoneHalfAxes = {
  azimuthDegrees: number;
  upDegrees: number;
  downDegrees: number;
};

export const CROSSVIEW_CHECKED_ZONE: CrossviewCoverageZoneHalfAxes = {
  azimuthDegrees: 45,
  upDegrees: 30,
  downDegrees: 20
};

export const CROSSVIEW_TRAINED_ZONE: CrossviewCoverageZoneHalfAxes = {
  azimuthDegrees: 90,
  upDegrees: 45,
  downDegrees: 35
};

type WorldPoint = [x: number, y: number, z: number];
export type ScreenPoint = { x: number; y: number };

export type CrossviewCameraGlyph = {
  apex: ScreenPoint;
  lensCorners: [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint];
  upMarker: [ScreenPoint, ScreenPoint, ScreenPoint];
};

export type CrossviewCameraViewGeometry = {
  subject: ScreenPoint;
  ground: ScreenPoint[];
  latitudeLines: {
    elevationDegrees: number;
    isBandEdge: boolean;
    points: ScreenPoint[];
  }[];
  longitudeLines: {
    azimuthDegrees: number;
    isBandEdge: boolean;
    points: ScreenPoint[];
  }[];
  trainedZone: ScreenPoint[];
  checkedZone: ScreenPoint[];
  orbitPath: ScreenPoint[];
  sourceCamera: CrossviewCameraGlyph;
  newCamera: CrossviewCameraGlyph;
};

const toRadians = (degrees: number) =>
  (degrees * Math.PI) / DEGREES_PER_HALF_TURN;

const add = (a: WorldPoint, b: WorldPoint): WorldPoint => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2]
];
const scale = (vector: WorldPoint, factor: number): WorldPoint => [
  vector[0] * factor,
  vector[1] * factor,
  vector[2] * factor
];
const cross = (a: WorldPoint, b: WorldPoint): WorldPoint => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const normalize = (vector: WorldPoint): WorldPoint =>
  scale(vector, 1 / Math.hypot(vector[0], vector[1], vector[2]));

export const directionOnOrbit = (
  azimuthDegrees: number,
  elevationDegrees: number
): WorldPoint => {
  const azimuth = toRadians(azimuthDegrees);
  const elevation = toRadians(elevationDegrees);
  return [
    Math.cos(elevation) * Math.sin(azimuth),
    Math.sin(elevation),
    Math.cos(elevation) * Math.cos(azimuth)
  ];
};

const heightInObserverView = ([, y, z]: WorldPoint): number => {
  const pitch = toRadians(OBSERVER_PITCH_DEGREES);
  return y * Math.cos(pitch) - z * Math.sin(pitch);
};

const SOURCE_CAMERA_HEIGHT_IN_OBSERVER_VIEW = heightInObserverView([0, 0, 1]);

export const projectToScreen = (point: WorldPoint): ScreenPoint => ({
  x: VIEW_CENTER_X + ORBIT_RADIUS_PX * point[0],
  y:
    VIEW_CENTER_Y -
    ORBIT_RADIUS_PX *
      (heightInObserverView(point) - SOURCE_CAMERA_HEIGHT_IN_OBSERVER_VIEW)
});

const projectOrbitPoint = (azimuthDegrees: number, elevationDegrees: number) =>
  projectToScreen(directionOnOrbit(azimuthDegrees, elevationDegrees));

const stepsBetween = (from: number, to: number): number[] => {
  const stepCount = Math.max(
    1,
    Math.round(Math.abs(to - from) / CURVE_STEP_DEGREES)
  );
  return Array.from(
    { length: stepCount + 1 },
    (_unused, step) => from + ((to - from) * step) / stepCount
  );
};

const buildLatitudeLine = (elevationDegrees: number): ScreenPoint[] =>
  stepsBetween(
    -CROSSVIEW_REACHABLE_BAND.azimuthLimitDegrees,
    CROSSVIEW_REACHABLE_BAND.azimuthLimitDegrees
  ).map((azimuth) => projectOrbitPoint(azimuth, elevationDegrees));

const buildLongitudeLine = (azimuthDegrees: number): ScreenPoint[] =>
  stepsBetween(
    -CROSSVIEW_REACHABLE_BAND.elevationLimitDegrees,
    CROSSVIEW_REACHABLE_BAND.elevationLimitDegrees
  ).map((elevation) => projectOrbitPoint(azimuthDegrees, elevation));

const buildZoneOutline = (zone: CrossviewCoverageZoneHalfAxes): ScreenPoint[] =>
  stepsBetween(0, DEGREES_PER_TURN).map((angleDegrees) => {
    const angle = toRadians(angleDegrees);
    const verticalHalfAxis =
      Math.sin(angle) >= 0 ? zone.upDegrees : zone.downDegrees;
    return projectOrbitPoint(
      zone.azimuthDegrees * Math.cos(angle),
      verticalHalfAxis * Math.sin(angle)
    );
  });

const buildGround = (): ScreenPoint[] =>
  Array.from({ length: GROUND_SEGMENTS }, (_unused, segment) => {
    const angle = (segment / GROUND_SEGMENTS) * 2 * Math.PI;
    return projectToScreen([
      GROUND_RADIUS_RATIO * Math.sin(angle),
      0,
      GROUND_RADIUS_RATIO * Math.cos(angle)
    ]);
  });

export const buildCrossviewCameraGlyph = (
  azimuthDegrees: number,
  elevationDegrees: number
): CrossviewCameraGlyph => {
  const position = directionOnOrbit(azimuthDegrees, elevationDegrees);
  const forward = normalize(scale(position, -1));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const lensCenter = add(position, scale(forward, CAMERA_LENS_DEPTH));
  const lensPoint = (rightFactor: number, upFactor: number) =>
    projectToScreen(
      add(
        lensCenter,
        add(
          scale(right, rightFactor * CAMERA_LENS_HALF_WIDTH),
          scale(up, upFactor * CAMERA_LENS_HALF_HEIGHT)
        )
      )
    );
  const upMarkerBase = add(
    lensCenter,
    scale(up, CAMERA_LENS_HALF_HEIGHT + CAMERA_UP_MARKER_GAP)
  );
  return {
    apex: projectToScreen(position),
    lensCorners: [
      lensPoint(-1, 1),
      lensPoint(1, 1),
      lensPoint(1, -1),
      lensPoint(-1, -1)
    ],
    upMarker: [
      projectToScreen(
        add(upMarkerBase, scale(right, -CAMERA_UP_MARKER_HALF_WIDTH))
      ),
      projectToScreen(
        add(upMarkerBase, scale(right, CAMERA_UP_MARKER_HALF_WIDTH))
      ),
      projectToScreen(add(upMarkerBase, scale(up, CAMERA_UP_MARKER_HEIGHT)))
    ]
  };
};

export const buildCrossviewCameraViewGeometry = (
  camera: MiniMaxH3CrossviewCamera
): CrossviewCameraViewGeometry => {
  return {
    subject: projectToScreen([0, 0, 0]),
    ground: buildGround(),
    latitudeLines: symmetricSteps(
      CROSSVIEW_REACHABLE_BAND.elevationLimitDegrees,
      GRID_ELEVATION_STEP_DEGREES
    ).map((elevationDegrees) => ({
      elevationDegrees,
      isBandEdge:
        Math.abs(elevationDegrees) ===
        CROSSVIEW_REACHABLE_BAND.elevationLimitDegrees,
      points: buildLatitudeLine(elevationDegrees)
    })),
    longitudeLines: symmetricSteps(
      CROSSVIEW_REACHABLE_BAND.azimuthLimitDegrees,
      GRID_AZIMUTH_STEP_DEGREES
    ).map((azimuthDegrees) => ({
      azimuthDegrees,
      isBandEdge:
        Math.abs(azimuthDegrees) ===
        CROSSVIEW_REACHABLE_BAND.azimuthLimitDegrees,
      points: buildLongitudeLine(azimuthDegrees)
    })),
    trainedZone: buildZoneOutline(CROSSVIEW_TRAINED_ZONE),
    checkedZone: buildZoneOutline(CROSSVIEW_CHECKED_ZONE),
    orbitPath: Array.from(
      { length: ORBIT_PATH_SEGMENTS + 1 },
      (_unused, step) =>
        projectOrbitPoint(
          (camera.azimuthDegrees * step) / ORBIT_PATH_SEGMENTS,
          (camera.elevationDegrees * step) / ORBIT_PATH_SEGMENTS
        )
    ),
    sourceCamera: buildCrossviewCameraGlyph(0, 0),
    newCamera: buildCrossviewCameraGlyph(
      camera.azimuthDegrees,
      camera.elevationDegrees
    )
  };
};

const clamp = (value: number, limit: number) =>
  Math.min(limit, Math.max(-limit, value));

export const screenPointToOrbitAngles = (
  screenPoint: ScreenPoint
): { azimuthDegrees: number; elevationDegrees: number } => {
  const pitch = toRadians(OBSERVER_PITCH_DEGREES);
  const sideways = clamp((screenPoint.x - VIEW_CENTER_X) / ORBIT_RADIUS_PX, 1);
  const heightInView =
    SOURCE_CAMERA_HEIGHT_IN_OBSERVER_VIEW -
    (screenPoint.y - VIEW_CENTER_Y) / ORBIT_RADIUS_PX;
  const verticalCircleRadius = Math.sqrt(1 - sideways * sideways);
  const angleInVerticalCircle =
    verticalCircleRadius === 0
      ? 0
      : pitch + Math.asin(clamp(heightInView / verticalCircleRadius, 1));
  const height = verticalCircleRadius * Math.sin(angleInVerticalCircle);
  const towardSourceCamera =
    verticalCircleRadius * Math.cos(angleInVerticalCircle);
  const toDegrees = (radians: number) =>
    (radians * DEGREES_PER_HALF_TURN) / Math.PI;
  return {
    azimuthDegrees: clamp(
      toDegrees(Math.atan2(sideways, towardSourceCamera)),
      CROSSVIEW_REACHABLE_BAND.azimuthLimitDegrees
    ),
    elevationDegrees: clamp(
      toDegrees(Math.asin(clamp(height, 1))),
      CROSSVIEW_REACHABLE_BAND.elevationLimitDegrees
    )
  };
};
