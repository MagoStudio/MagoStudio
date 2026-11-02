export const LONG_FORM_RUN_PATH_PREFIX = "/long-form/";

export const isLongFormRunPath = (pathname: string): boolean =>
  pathname.startsWith(LONG_FORM_RUN_PATH_PREFIX);
