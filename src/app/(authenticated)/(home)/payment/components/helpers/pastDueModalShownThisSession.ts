const PAST_DUE_MODAL_SHOWN_KEY = "pastDueModalShown";

let wasShownBeforeThisPageLoad: boolean | undefined;

export const wasPastDueModalShownThisSession = (): boolean => {
  try {
    return sessionStorage.getItem(PAST_DUE_MODAL_SHOWN_KEY) === "true";
  } catch {
    return false;
  }
};

export const wasPastDueModalShownBeforeThisPageLoad = (): boolean =>
  (wasShownBeforeThisPageLoad ??= wasPastDueModalShownThisSession());

export const resetPastDueModalPageLoadLatchForTests = (): void => {
  wasShownBeforeThisPageLoad = undefined;
};

export const markPastDueModalShownThisSession = (): void => {
  try {
    sessionStorage.setItem(PAST_DUE_MODAL_SHOWN_KEY, "true");
  } catch {
    return;
  }
};
