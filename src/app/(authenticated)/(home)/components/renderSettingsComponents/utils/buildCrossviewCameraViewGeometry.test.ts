import { describe, expect, it } from "vitest";

import {
  buildCrossviewCameraGlyph,
  CROSSVIEW_CAMERA_VIEW_HEIGHT,
  CROSSVIEW_CAMERA_VIEW_WIDTH,
  buildCrossviewCameraViewGeometry,
  directionOnOrbit,
  projectToScreen,
  screenPointToOrbitAngles
} from "./buildCrossviewCameraViewGeometry";

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe("directionOnOrbit", () => {
  it("puts the source camera in front of the subject", () => {
    const [x, y, z] = directionOnOrbit(0, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(1);
  });

  it("orbits right for a positive angle and up for a positive elevation", () => {
    expect(directionOnOrbit(90, 0)[0]).toBeCloseTo(1);
    expect(directionOnOrbit(0, 45)[1]).toBeGreaterThan(0);
  });
});

describe("projectToScreen", () => {
  it("puts the source camera, at 0° and 0°, in the centre of the view", () => {
    expect(projectToScreen(directionOnOrbit(0, 0))).toEqual({
      x: CROSSVIEW_CAMERA_VIEW_WIDTH / 2,
      y: CROSSVIEW_CAMERA_VIEW_HEIGHT / 2
    });
  });

  it("draws the front of the scene below the subject, as seen from above", () => {
    expect(projectToScreen([0, 0, 1]).y).toBeGreaterThan(
      projectToScreen([0, 0, 0]).y
    );
  });

  it("keeps right on the right", () => {
    expect(projectToScreen([1, 0, 0]).x).toBeGreaterThan(
      projectToScreen([-1, 0, 0]).x
    );
  });
});

describe("buildCrossviewCameraGlyph", () => {
  it("points the lens at the subject", () => {
    const camera = buildCrossviewCameraGlyph(60, 15);
    const subject = projectToScreen([0, 0, 0]);
    const lensCenter = {
      x: camera.lensCorners.reduce((sum, corner) => sum + corner.x, 0) / 4,
      y: camera.lensCorners.reduce((sum, corner) => sum + corner.y, 0) / 4
    };
    expect(distance(lensCenter, subject)).toBeLessThan(
      distance(camera.apex, subject)
    );
  });

  it("puts the up marker above the lens for a level camera", () => {
    const camera = buildCrossviewCameraGlyph(0, 0);
    const lensTop = Math.min(...camera.lensCorners.map((corner) => corner.y));
    expect(camera.upMarker[2].y).toBeLessThan(lensTop);
  });
});

describe("buildCrossviewCameraViewGeometry", () => {
  const geometry = buildCrossviewCameraViewGeometry({
    azimuthDegrees: -45,
    elevationDegrees: 20
  });

  it("runs the orbit path from the source camera to the new camera", () => {
    expect(geometry.orbitPath[0]).toEqual(
      projectToScreen(directionOnOrbit(0, 0))
    );
    expect(geometry.orbitPath.at(-1)).toEqual(
      projectToScreen(directionOnOrbit(-45, 20))
    );
    expect(geometry.newCamera.apex).toEqual(
      projectToScreen(directionOnOrbit(-45, 20))
    );
  });

  it("draws only the reachable band, with the checked zone inside the trained one", () => {
    expect(geometry.latitudeLines.map((line) => line.elevationDegrees)).toEqual(
      [-45, -30, -15, 0, 15, 30, 45]
    );
    expect(geometry.longitudeLines.map((line) => line.azimuthDegrees)).toEqual([
      -90, -60, -30, 0, 30, 60, 90
    ]);
    const widthOf = (points: { x: number }[]) =>
      Math.max(...points.map((point) => point.x)) -
      Math.min(...points.map((point) => point.x));
    expect(widthOf(geometry.checkedZone)).toBeLessThan(
      widthOf(geometry.trainedZone)
    );
  });
});

describe("screenPointToOrbitAngles", () => {
  it.each([
    [0, 0],
    [30, 10],
    [-60, 20],
    [75, -30],
    [-89, 44]
  ])(
    "finds %i° and %i° back from where they are drawn",
    (azimuth, elevation) => {
      const angles = screenPointToOrbitAngles(
        projectToScreen(directionOnOrbit(azimuth, elevation))
      );
      expect(angles.azimuthDegrees).toBeCloseTo(azimuth, 5);
      expect(angles.elevationDegrees).toBeCloseTo(elevation, 5);
    }
  );

  it("keeps a point outside the band on the band's edge", () => {
    const farTopRight = screenPointToOrbitAngles({ x: 1000, y: -1000 });
    expect(farTopRight.azimuthDegrees).toBe(90);
    expect(farTopRight.elevationDegrees).toBeLessThanOrEqual(45);
    const farBottomLeft = screenPointToOrbitAngles({ x: -1000, y: 1000 });
    expect(farBottomLeft.azimuthDegrees).toBe(-90);
    expect(farBottomLeft.elevationDegrees).toBeGreaterThanOrEqual(-45);
  });
});
