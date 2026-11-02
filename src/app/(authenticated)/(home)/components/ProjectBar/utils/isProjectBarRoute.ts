import { ROUTES } from "@config/constants";

const PROJECT_BAR_ROUTES = [
  ROUTES.PROJECT,
  ROUTES.PROJECT_TIMELINE,
  ROUTES.SCRIPT_PROJECT
];

export const isProjectBarRoute = (pathname: string): boolean =>
  PROJECT_BAR_ROUTES.some((route) => pathname.startsWith(route));
