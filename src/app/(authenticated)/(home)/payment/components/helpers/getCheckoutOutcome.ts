export type CheckoutOutcome = "success" | "canceled";

const CREDITS_TAB = "credits";

export const getCheckoutOutcome = (
  searchParams: URLSearchParams
): CheckoutOutcome | null => {
  const fromTab = searchParams.get("tab");
  if (fromTab && fromTab !== CREDITS_TAB) return null;

  if (searchParams.get("success") === "true") return "success";
  if (searchParams.get("canceled") === "true") return "canceled";

  return null;
};
