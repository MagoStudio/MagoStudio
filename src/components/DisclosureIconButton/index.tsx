import { ElementPalette, GlyphPalette } from "@styles/types";
import { cn } from "@utils";

import { Icon } from "../Icon";

type AvailableDirections = "up" | "down" | "left" | "right";

interface DirectionConfig {
  closedDirection: AvailableDirections;
  openedDirection: AvailableDirections;
}

const DEFAULT_DIRECTIONS = {
  closedDirection: "up",
  openedDirection: "down"
} as const;

type Props = {
  arrowDirections?: DirectionConfig;
  color?: GlyphPalette | ElementPalette;
  open?: boolean;
  reverse?: boolean;
};

const getIconNameForDirection = ({
  direction,
  reverse
}: {
  direction: AvailableDirections;
  reverse?: boolean;
}) => {
  switch (direction) {
    case "down":
      return reverse ? "chevron-down" : "chevron-up";
    case "right":
      return reverse ? "chevron-left" : "chevron-right";
    case "up":
      return reverse ? "chevron-up" : "chevron-down";
    case "left":
      return reverse ? "chevron-right" : "chevron-left";
  }
};

export const DisclosureIconButton: React.FC<Props> = ({
  arrowDirections = DEFAULT_DIRECTIONS,
  color,
  open,
  reverse
}) => {
  const currentDirection = open
    ? arrowDirections.openedDirection
    : arrowDirections.closedDirection;

  const iconName = getIconNameForDirection({
    direction: currentDirection,
    reverse
  });

  return (
    <div className="px-2 cursor-pointer">
      <Icon
        iconSet="16"
        iconName={iconName}
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        className={color ? cn(`text-${color}`) : undefined}
        aria-label="Disclosure button"
      />
    </div>
  );
};
