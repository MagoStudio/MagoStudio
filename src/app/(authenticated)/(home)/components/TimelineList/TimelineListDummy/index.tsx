import { Divider } from "@components/Divider";

import { TimelineControls } from "../TimelineControls";
import { TimePanel } from "../TimePanel";

interface Props {
  children?: React.ReactNode;
}

export function TimelineListDummy({ children }: Props) {
  return (
    <div>
      <div
        className="relative p-1 w-full flex items-center justify-between z-50 bg-surface-secondary h-settings-disclosure"
        style={{ minHeight: "var(--height-settings-disclosure)" }}
      >
        <TimelineControls disabled />
      </div>
      <Divider className="z-50" />
      <TimePanel disabled />
      {children}
    </div>
  );
}
