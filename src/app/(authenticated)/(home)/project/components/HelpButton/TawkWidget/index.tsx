import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { cn } from "@utils";
import React from "react";

import { useTawkTo } from "./useTawk";

interface Props {
  showChat: boolean;
  onClose: () => void;
}

export const TawkWidget: React.FC<Props> = ({ showChat, onClose }) => {
  useTawkTo({ showChat });

  return (
    <div
      id="tawk_68d13ab389caa6192613d3f0"
      className={cn(
        "absolute z-10 right-4 bottom-[64px] pt-8 rounded-sm pointer-events-auto",
        showChat ? "bg-element-additional-active" : "hidden"
      )}
    >
      {/* oxlint-disable-next-line local/no-arbitrary-z-index -- must outrank the
      Tawk SDK's injected iframe, whose z-index this codebase does not control
      and cannot observe without a live Tawk key. Scoped to this container's
      stacking context, so it cannot leak. */}
      <div className="absolute top-2 right-2 z-[9999]">
        <IconActionButton
          icon={<Icon iconSet="16" iconName="cross" className="text-white" />}
          onPress={onClose}
          aria-label="Close"
        />
      </div>
    </div>
  );
};
