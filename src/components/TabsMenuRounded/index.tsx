import { cn } from "@utils";
import { Fragment } from "react";
import { Tab, TabList } from "react-aria-components/Tabs";
type Props = {
  className?: string;
  tabs?: {
    name?: string;
    id?: string;
    showGradient?: boolean;
    gifSrc?: string;
  }[];
};

export const TabsMenuRounded: React.FC<Props> = ({ className, tabs }) => {
  return (
    <TabList className={cn("flex items-center gap-1.5", className)}>
      {tabs?.map((item, index) => (
        <Fragment key={index}>
          <Tab
            id={item.id}
            className={({ isSelected }) =>
              cn(
                "relative flex text-lg items-center justify-center rounded-[20px] text-center leading-8 py-1 px-5 min-w-28",
                isSelected
                  ? item.showGradient
                    ? "bg-gradient-100 !text-white"
                    : "bg-element-primary-on-pic text-glyph-invert-main"
                  : "backdrop-blur-lg text-glyph-primary-on-pic shadow-glassmorphism"
              )
            }
            key={`tab-${index}`}
            data-testid={item.name}
          >
            {item.gifSrc && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <img
                  src={item.gifSrc}
                  alt="Sales"
                  className="h-16 w-16 select-none"
                />
              </div>
            )}
            {item.name}
          </Tab>
        </Fragment>
      ))}
    </TabList>
  );
};
