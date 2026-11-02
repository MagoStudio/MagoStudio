"use client";

import { Tooltip } from "@components/Tooltip";
import { cn } from "@utils";

type Tab = {
  tooltip?: string;
  name?: string;
  id: string;
  icon?: React.ReactNode;
  isDisabled?: boolean;
};

interface Props {
  tabs: Tab[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  className?: string;
}

export const ProjectModeSelector: React.FC<Props> = ({
  tabs,
  selectedKey,
  onSelectionChange,
  className
}) => {
  return (
    <div role="tablist" className={cn("flex items-center gap-0", className)}>
      {tabs.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={selectedKey === item.id}
          disabled={item.isDisabled}
          onClick={() => {
            if (!item.isDisabled) {
              onSelectionChange(item.id);
            }
          }}
          data-testid={item.name}
          className={cn(
            "h-full relative flex items-center justify-center text-sm font-medium text-glyph-secondary hover:bg-element-primary-active px-4",
            "border-l border-r border-glyph-invert-main -mr-px",
            selectedKey === item.id &&
              "bg-surface-secondary text-glyph-primary",
            item.isDisabled && "opacity-40"
          )}
        >
          <Tooltip
            textContent={item.tooltip!}
            disabled={!item.tooltip}
            placement="top"
          >
            <div className="flex items-center justify-center gap-2">
              {item.icon && (
                <div
                  className="h-10 flex items-center justify-center"
                  aria-label={item.tooltip}
                >
                  {item.icon}
                </div>
              )}
              <div className="flex items-center justify-center">
                {item.name}
              </div>
            </div>
          </Tooltip>
        </button>
      ))}
    </div>
  );
};
