/* oxlint-disable custom-react/no-use-effect -- the write must happen after render, not during it, so a long-lived listener can read the newest value */

import { useEffect, useRef } from "react";

export const useLatestRef = <T>(value: T): React.RefObject<T> => {
  const latestValueRef = useRef(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  return latestValueRef;
};
