const SQUARE_DIMENSION = 512;
const PORTRAIT_WIDTH = 512;
const PORTRAIT_HEIGHT = 1024;
const LANDSCAPE_WIDTH = 1024;
const LANDSCAPE_HEIGHT = 512;

export const PRICE_CENTS_DIVISOR = 100;
export const MAX_CREDITS_MODE = 2000;
export const CREDIT_MODE_SIMULTANEOUS_VIDEO_RENDERS = 5;

export const CREDITS_PER_SECOND = 1;

export const aspectRatios: Record<string, [number, number]> = {
  square: [SQUARE_DIMENSION, SQUARE_DIMENSION],
  vertical: [PORTRAIT_WIDTH, PORTRAIT_HEIGHT],
  horizontal: [LANDSCAPE_WIDTH, LANDSCAPE_HEIGHT]
};

export const ROUTES = {
  HOME: "/",
  PAYMENT_MAIN_PAGE: "/payment/",
  PAYMENT_CREDITS: "/payment/?tab=credits",
  PAYMENT_SUBSCRIPTIONS: "/payment/?tab=subscriptions",
  PRICING_PAGE: "/pricing/",
  PROJECT: "/project/",
  PROJECT_TIMELINE: "/project-timeline/",
  SCRIPT_PROJECT: "/script-project",
  PROJECTS_BY_TYPE: "/projects/",
  PLAN: "/plan/",
  ONBOARDING: "/onboarding/"
};

export const ONBOARDING_SEARCH_PARAM = "onboarding";

const TRACK_BORDER_WIDTH = 4;
const TRACK_SCROLLBAR_GUTTER = 4;
const TRACK_WIDTH = 520;
export const TRACK_WIDTH_WITHOUT_BORDER =
  TRACK_WIDTH - TRACK_BORDER_WIDTH - TRACK_SCROLLBAR_GUTTER;

export const FIVE_MINUTES_IN_MS = 300000;
