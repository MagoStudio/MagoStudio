const SCENE_SHOT_SECONDS_PER_TENTH = 10;

export const roundSceneShotSeconds = (seconds: number): number =>
  Math.round(seconds * SCENE_SHOT_SECONDS_PER_TENTH) /
  SCENE_SHOT_SECONDS_PER_TENTH;
