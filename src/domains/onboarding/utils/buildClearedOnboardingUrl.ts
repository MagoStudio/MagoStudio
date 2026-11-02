import { ONBOARDING_SEARCH_PARAM, ROUTES } from "@config/constants";
import { TOOL_URL_PARAM } from "@hooks/tool/useTool";

export function buildClearedOnboardingUrl(
  pathname: string | null,
  search: string
): string {
  const params = new URLSearchParams(search);
  params.delete(ONBOARDING_SEARCH_PARAM);
  const hasRemainingParams = params.toString().length > 0;
  params.set(TOOL_URL_PARAM, "render-video");
  const query = params.toString();
  return hasRemainingParams
    ? `${pathname}?${query}`
    : (pathname ?? ROUTES.PROJECT);
}
