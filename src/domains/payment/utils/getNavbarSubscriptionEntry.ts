export type NavbarSubscriptionEntry = "pricing-link" | "subscribe" | "nothing";

export const getNavbarSubscriptionEntry = ({
  isSubscriptionLoading,
  doesSubscriptionGrantAccess
}: {
  isSubscriptionLoading: boolean;
  doesSubscriptionGrantAccess: boolean;
}): NavbarSubscriptionEntry => {
  if (isSubscriptionLoading) return "nothing";

  return doesSubscriptionGrantAccess ? "pricing-link" : "subscribe";
};
