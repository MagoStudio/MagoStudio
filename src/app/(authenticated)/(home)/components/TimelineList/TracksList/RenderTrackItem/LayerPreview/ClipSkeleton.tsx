import { AnimatedGradient } from "@components/AnimatedGradient";
import { Skeleton } from "@components/Skeleton";
import React from "react";
interface Props {
  isAnimated?: boolean;
}

export const ClipSkeleton: React.FC<Props> = ({
  isAnimated = false
}: Props) => {
  return isAnimated ? (
    <AnimatedGradient />
  ) : (
    <Skeleton height="100%" width="100%" />
  );
};
