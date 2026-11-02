import { layout, prepare } from "@chenglou/pretext";
import { useLayoutEffect, useRef, useState } from "react";

import { computeTwoLineTruncatedFromStart } from "../utils/computeTwoLineTruncatedFromStart";

const MAX_VISIBLE_LINES = 2;

export function useTwoLineTruncatedFromStart(fullName: string) {
  const nameElementRef = useRef<HTMLElement>(null);
  const [truncatedName, setTruncatedName] = useState(fullName);

  // oxlint-disable-next-line custom-react/no-use-effect -- reads the rendered element's width and computed font once via a layout-triggering DOM read with no non-DOM equivalent; every truncation candidate afterwards is measured off-DOM by pretext's canvas-backed layout(), so no further DOM reads or writes happen per candidate
  useLayoutEffect(() => {
    const nameElement = nameElementRef.current;
    if (!nameElement) {
      setTruncatedName(fullName);
      return;
    }

    const computedStyle = getComputedStyle(nameElement);
    const font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    const lineHeightPx = parseFloat(computedStyle.lineHeight);
    const maxWidthPx = nameElement.clientWidth;

    setTruncatedName(
      computeTwoLineTruncatedFromStart(fullName, (candidate) => {
        const preparedCandidate = prepare(candidate, font);
        return (
          layout(preparedCandidate, maxWidthPx, lineHeightPx).lineCount <=
          MAX_VISIBLE_LINES
        );
      })
    );
  }, [fullName]);

  return { truncatedName, nameElementRef };
}
