import { Fragment } from "react";

import type { RulerTick } from "../rulerTicks";

type Props = {
  rulerHeight: number;
  dotTickHeight: number;
  notchesAndTicks: RulerTick[];
  notchHeight: number;
};

export const NotchTickRenderer: React.FC<Props> = ({
  notchesAndTicks,
  rulerHeight,
  dotTickHeight,
  notchHeight
}) => {
  return (
    <>
      {notchesAndTicks.map((element, index) => {
        const x = element.x;
        const isMajor = element.kind === "major";
        const tickHeight = isMajor ? dotTickHeight : notchHeight;
        const y = rulerHeight - tickHeight;

        return (
          <Fragment key={index}>
            {isMajor && (
              <rect
                fill="currentColor"
                height={tickHeight}
                width="1"
                x={x}
                y={y}
              />
            )}

            {!isMajor && (
              <rect
                fill="currentColor"
                opacity={0.6}
                height={tickHeight}
                width="1"
                x={x}
                y={y}
              />
            )}

            {isMajor && element.label && (
              <text
                x={x}
                y={12}
                fill="currentColor"
                fontSize={10}
                fontWeight={500}
                textAnchor="middle"
              >
                {element.label}
              </text>
            )}
          </Fragment>
        );
      })}
    </>
  );
};
