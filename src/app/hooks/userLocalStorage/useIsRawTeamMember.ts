import { useUser } from "@platform/identity";

export const useIsRawTeamMember = () => {
  const { user } = useUser();

  const email = user?.emailAddresses[0]?.emailAddress;

  return !!email?.includes("@mago.studio");
};
