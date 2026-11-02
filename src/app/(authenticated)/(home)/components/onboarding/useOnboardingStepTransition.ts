/* oxlint-disable custom-react/no-use-effect -- legitimate external sync: ties the
   crossfade exit layer to a DOM animation timer. */
import { ReactNode, useEffect, useState } from "react";

import {
  advanceStepTransition,
  completeStepExit,
  initStepTransition,
  StepTransitionState
} from "./stepTransitionState";

const STEP_TRANSITION_MS = 300;

type StepLayerRole = "entering" | "exiting";

export interface StepLayer {
  key: string;
  node: ReactNode;
  role: StepLayerRole;
}

export const useOnboardingStepTransition = (
  transitionKey: string,
  children: ReactNode
): StepLayer[] => {
  const [state, setState] = useState<StepTransitionState>(() =>
    initStepTransition(transitionKey, children)
  );

  if (state.currentKey !== transitionKey) {
    setState((prev) => advanceStepTransition(prev, transitionKey, children));
  }

  useEffect(() => {
    if (state.exitingKey === null) return;
    const timeout = setTimeout(() => {
      setState((prev) => completeStepExit(prev));
    }, STEP_TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [state.exitingKey]);

  const layers: StepLayer[] = [];
  if (state.exitingKey !== null) {
    layers.push({
      key: state.exitingKey,
      node: state.exitingNode,
      role: "exiting"
    });
  }
  layers.push({
    key: transitionKey,
    node: children,
    role: "entering"
  });
  return layers;
};
