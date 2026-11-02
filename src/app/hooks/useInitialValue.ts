import { useState } from "react";

export const useInitialValue = <T>(value: T): T => {
  const [initialValue] = useState(value);
  return initialValue;
};
