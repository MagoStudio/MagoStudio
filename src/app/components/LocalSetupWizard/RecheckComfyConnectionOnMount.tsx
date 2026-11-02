import { useMountEffect } from "@app/hooks/useMountEffect";

export const RecheckComfyConnectionOnMount = ({
  recheck
}: {
  recheck: () => void;
}) => {
  useMountEffect(recheck);
  return null;
};
