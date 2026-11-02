import { isNewUsersPaywallOpenAtom } from "@store/atoms";
import { useAtomValue } from "jotai";

import { isCloudAccountActive } from "@/platform/cloudAccount";

import { NewUsersPaywall } from "./NewUsersPaywall";

export const NewUsersPaywallHost: React.FC = () => {
  const isOpen = useAtomValue(isNewUsersPaywallOpenAtom);

  if (!isOpen) return null;
  // A user working offline has no account to upsell and nothing they cannot do:
  // local rendering is theirs regardless. Showing a paywall there would be a
  // wall in front of a door that is not locked.
  if (!isCloudAccountActive()) return null;

  return <NewUsersPaywall />;
};
