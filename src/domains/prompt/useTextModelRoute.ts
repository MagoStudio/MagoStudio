export type TextModelRoute = "local" | "cloud";

/**
 * Where the prompt-rewrite buttons run their LLM call. The cloud build has no
 * choice to make: the server owns the model, and the label stays unmarked.
 */
export const useTextModelRoute = (): {
  route: TextModelRoute;
  routeLabel?: string;
  isRoutePending: boolean;
} => ({ route: "cloud", isRoutePending: false });
