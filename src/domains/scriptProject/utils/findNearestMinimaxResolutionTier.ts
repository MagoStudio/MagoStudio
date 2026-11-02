const MINIMAX_RESOLUTION_TIERS = [
  { tier: "480P", shortEdgePx: 480 },
  { tier: "768P", shortEdgePx: 768 },
  { tier: "1080P", shortEdgePx: 1080 }
] as const;

export type MinimaxResolutionTier =
  (typeof MINIMAX_RESOLUTION_TIERS)[number]["tier"];

export const findNearestMinimaxResolutionTier = (
  shortEdgePx: number
): MinimaxResolutionTier =>
  MINIMAX_RESOLUTION_TIERS.reduce((nearestTier, candidateTier) =>
    Math.abs(candidateTier.shortEdgePx - shortEdgePx) <
    Math.abs(nearestTier.shortEdgePx - shortEdgePx)
      ? candidateTier
      : nearestTier
  ).tier;
