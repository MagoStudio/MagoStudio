/* oxlint-disable custom-react/no-use-effect -- wrapper hook for mount-only effects */
/* oxlint-disable react-hooks/exhaustive-deps -- intentionally empty deps for mount-only */
import { useEffect } from "react";

export function useMountEffect(effect: () => void | (() => void)) {
  useEffect(effect, []);
}
