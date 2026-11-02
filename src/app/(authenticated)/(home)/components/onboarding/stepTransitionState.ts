import { ReactNode } from "react";

export interface StepTransitionState {
  currentKey: string;
  currentNode: ReactNode;
  exitingKey: string | null;
  exitingNode: ReactNode;
}

export const initStepTransition = (
  key: string,
  node: ReactNode
): StepTransitionState => ({
  currentKey: key,
  currentNode: node,
  exitingKey: null,
  exitingNode: null
});

export const advanceStepTransition = (
  state: StepTransitionState,
  nextKey: string,
  nextNode: ReactNode
): StepTransitionState => {
  if (state.currentKey === nextKey) return state;
  return {
    currentKey: nextKey,
    currentNode: nextNode,
    exitingKey: state.currentKey,
    exitingNode: state.currentNode
  };
};

export const completeStepExit = (
  state: StepTransitionState
): StepTransitionState => {
  if (state.exitingKey === null) return state;
  return { ...state, exitingKey: null, exitingNode: null };
};
