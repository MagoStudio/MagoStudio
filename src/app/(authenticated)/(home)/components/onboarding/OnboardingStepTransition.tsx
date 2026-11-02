import { cn } from "@utils";
import { ReactNode } from "react";

import { useOnboardingStepTransition } from "./useOnboardingStepTransition";

interface OnboardingStepTransitionProps {
  transitionKey: string;
  children: ReactNode;
}

export const OnboardingStepTransition: React.FC<
  OnboardingStepTransitionProps
> = ({ transitionKey, children }) => {
  const layers = useOnboardingStepTransition(transitionKey, children);

  return (
    <div className="relative h-full w-full">
      {layers.map(({ key, node, role }) => (
        <div
          key={key}
          aria-hidden={role === "exiting" || undefined}
          className={cn(
            "h-full w-full",
            role === "exiting"
              ? "absolute inset-0 animate-fade-out"
              : "animate-fade-slide-in"
          )}
        >
          {node}
        </div>
      ))}
    </div>
  );
};
