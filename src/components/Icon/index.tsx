/* oxlint-disable custom-react/no-use-effect -- legitimate useEffect for external sync */

import { cn } from "@utils";
import React, { useEffect, useState } from "react";

import { type IconName, type IconSet, getIconLoader } from "./iconRegistry";

const ICON_SET_SIZES: Record<IconSet, string> = {
  "16": "h-4 w-4",
  "16-filled": "h-4 w-4",
  "16-technical": "h-4 w-4",
  "24": "h-6 w-6",
  "24-filled": "h-6 w-6",
  bold: "h-6 w-6",
  decorators: "w-[59px] h-[7px]",
  loading: "h-6 w-6",
  pixels: "h-6 w-6"
};

interface IconProps<T extends IconSet = IconSet> {
  iconSet: T;
  iconName: IconName<T>;
  className?: string;
}

export function Icon<T extends IconSet>({
  iconSet,
  iconName,
  className
}: IconProps<T>) {
  const [SVGComponent, setSVGComponent] = useState<React.ComponentType<
    React.SVGProps<SVGSVGElement>
  > | null>(null);

  useEffect(() => {
    const loader = getIconLoader(iconSet, iconName);
    if (loader) {
      void loader().then(
        (module: {
          default: React.ComponentType<React.SVGProps<SVGSVGElement>>;
        }) => {
          setSVGComponent(() => module.default);
        }
      );
    }
  }, [iconSet, iconName]);

  const sizeClass = ICON_SET_SIZES[iconSet];

  if (!SVGComponent) {
    return <div className={cn(sizeClass, className)} />;
  }

  return (
    <SVGComponent
      className={cn(sizeClass, "shrink-0", className)}
      aria-hidden="true"
    />
  );
}
