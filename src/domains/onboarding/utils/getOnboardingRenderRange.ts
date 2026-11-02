import { ONBOARDING_RENDER_DURATION_SECONDS } from "../constants";

export const getOnboardingRenderRange = (
  shotMaxFrames: number,
  fps: number
): [number, number] => {
  const targetFrames = Math.round(ONBOARDING_RENDER_DURATION_SECONDS * fps);
  return [0, Math.min(targetFrames, shotMaxFrames)];
};
