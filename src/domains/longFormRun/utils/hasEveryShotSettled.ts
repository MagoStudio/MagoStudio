import { ShotCardState } from "./deriveShotCardState";

const SETTLED_SHOT_CARD_STATES = new Set<ShotCardState>(["ready", "failed"]);

export const hasEveryShotSettled = (cardStates: ShotCardState[]): boolean =>
  cardStates.length > 0 &&
  cardStates.every((cardState) => SETTLED_SHOT_CARD_STATES.has(cardState));
