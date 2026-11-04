import { Tooltip } from "@components/Tooltip";
import { cn } from "@utils";
import { Fragment } from "react";
import { Tab, TabList } from "react-aria-components/Tabs";
type Props = {
  className?: string;
  afterTabs?: React.ReactNode;
  tabs?: {
    tooltip?: string;
    name?: string;
    id: string;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
    isDisabled?: boolean;
  }[];
};

export const TabMenuRegular: React.FC<Props> = ({
  className,
  afterTabs,
  tabs
}) => {
  const tabItems = (
    <>
      {tabs?.map((item, index) => (
        <Fragment key={index}>
          <Tab
            id={item.id}
            isDisabled={item.isDisabled}
            className={({ isSelected }) =>
              cn(
                "h-full relative flex items-center justify-center py-0.5 min-h-9 text-sm font-medium text-glyph-secondary hover:bg-element-primary-active px-1.5",
                "border-b-2 border-b-transparent",
                isSelected && "border-b-glyph-action-main",
                item.isDisabled && "cursor-not-allowed opacity-40"
              )
            }
            key={`tab-${index}`}
            data-testid={item.name}
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
                {item.badge}
              </div>
            </Tooltip>
          </Tab>
        </Fragment>
      ))}
    </>
  );

  if (afterTabs) {
    return (
      <div className={cn("flex items-center gap-0", className)}>
        <TabList className="contents">{tabItems}</TabList>
        {afterTabs}
      </div>
    );
  }

  return (
    <TabList className={cn("flex items-center gap-0", className)}>
      {tabItems}
    </TabList>
  );
};
