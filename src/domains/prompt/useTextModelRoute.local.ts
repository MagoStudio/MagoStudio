import { useQuery } from "@tanstack/react-query";

import { isCloudAccountActive } from "@/platform/cloudAccount";
import { queryKeys } from "@/queryKeys";

import { resolveTextModelRoute } from "../../../desktop/shared/textModelRoute";

export type TextModelRoute = "local" | "cloud";

/**
 * Where the prompt-rewrite buttons run their LLM call: the text-model setting,
 * resolved against whether a Mago cloud account is signed in.
 *
 * `isRoutePending` holds until the setting has been read: guessing a route in
 * the meantime would send a user who chose local to Mago cloud (or the
 * reverse), so callers keep the button disabled instead. If the read fails,
 * the setting's default ("cloud") applies, as it does in the main process.
 *
 * `routeLabel` is shown on the button so the route is visible while the local
 * and cloud paths are being compared.
 */
export const useTextModelRoute = (): {
  route: TextModelRoute;
  routeLabel?: string;
  isRoutePending: boolean;
} => {
  // Without the bridge (Storybook, unit tests) there is no setting to wait for;
  // a disabled query would otherwise report pending forever.
  const hasBridge = typeof window !== "undefined" && !!window.mago;
  const { data, isPending } = useQuery({
    queryKey: queryKeys.comfySettings.all,
    queryFn: () => window.mago.comfy.get(),
    enabled: hasBridge,
    staleTime: Infinity
  });
  const route = resolveTextModelRoute({
    provider: data?.textModelProvider ?? "cloud",
    isCloudAccountActive: isCloudAccountActive()
  });
  if (hasBridge && isPending) return { route, isRoutePending: true };
  return { route, routeLabel: `(${route})`, isRoutePending: false };
};
