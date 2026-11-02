export const DRAFT_SAVING_ACTION_ATTRIBUTE = "data-saves-unsaved-draft";

export const isFocusMovingToDraftSavingAction = (
  nextFocusedTarget: EventTarget | null
) =>
  nextFocusedTarget instanceof Element &&
  nextFocusedTarget.closest(`[${DRAFT_SAVING_ACTION_ATTRIBUTE}]`) !== null;
