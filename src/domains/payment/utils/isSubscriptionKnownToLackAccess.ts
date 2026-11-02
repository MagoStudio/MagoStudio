export const isSubscriptionKnownToLackAccess = ({
  isSubscriptionLoading,
  doesSubscriptionGrantAccess
}: {
  isSubscriptionLoading: boolean;
  doesSubscriptionGrantAccess: boolean;
}): boolean => !isSubscriptionLoading && !doesSubscriptionGrantAccess;
