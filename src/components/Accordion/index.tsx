import { Icon } from "@components/Icon";
import { Text } from "@components/Text";
import { cn } from "@utils";
import { useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading
} from "react-aria-components";

type Props = {
  label: string;
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  children: React.ReactNode;
};

export const Accordion: React.FC<Props> = ({
  label,
  isExpanded,
  onExpandedChange,
  children
}) => {
  const [hasEverExpanded, setHasEverExpanded] = useState(isExpanded);
  const isExpandingForTheFirstTime = isExpanded && !hasEverExpanded;
  if (isExpandingForTheFirstTime) {
    setHasEverExpanded(true);
  }

  return (
    <Disclosure isExpanded={isExpanded} onExpandedChange={onExpandedChange}>
      <Heading level={3} className="contents">
        <Button
          slot="trigger"
          className="group flex h-8 w-full items-center gap-2 rounded-[4px] bg-element-primary px-2 outline-none"
        >
          <Icon
            iconSet="16"
            iconName="chevron-down"
            className={cn(
              "shrink-0 text-glyph-secondary transition-transform duration-200 group-hover:text-glyph-primary",
              !isExpanded && "-rotate-90"
            )}
          />
          <Text
            component="span"
            variant="sm"
            select="none"
            color="glyph-secondary"
            className="group-hover:text-glyph-primary"
          >
            {label}
          </Text>
        </Button>
      </Heading>
      <DisclosurePanel className="flex flex-col gap-3 pt-3 pb-1 pl-8 [&[hidden]]:hidden">
        {hasEverExpanded ? children : null}
      </DisclosurePanel>
    </Disclosure>
  );
};
