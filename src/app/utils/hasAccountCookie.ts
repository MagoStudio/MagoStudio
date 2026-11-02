const COOKIE_NAME = "mago_has_account";
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;
const COOKIE_MAX_AGE_SECONDS =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

export const hasAccountCookie = (): boolean => {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_NAME}=true`);
};

export const setHasAccountCookie = (): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=true; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
};
