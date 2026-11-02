import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { TabMenuRegular } from "@components/TabMenuRegular";
import { Text } from "@components/Text";
import { Heading } from "react-aria-components/Dialog";

export type BulkRenderingStepModalHeaderTab = {
  id: string;
  name: string;
};

export function BulkRenderingStepModalHeader({
  runName,
  tabs,
  closeButtonAriaLabel,
  onClose
}: {
  runName: string;
  tabs: BulkRenderingStepModalHeaderTab[];
  closeButtonAriaLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="relative flex h-14 shrink-0 items-center justify-between pl-4 pr-3 py-4 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.6)]">
      <Heading slot="title" className="contents">
        <Text component="span" variant="md" weight="bold" color="glyph-primary">
          {runName}
        </Text>
      </Heading>
      {tabs.length > 1 && (
        <TabMenuRegular
          className="absolute left-1/2 -translate-x-1/2"
          tabs={tabs}
        />
      )}
      <IconActionButton
        icon={<Icon iconSet="24" iconName="close" />}
        size="sm"
        variant="transparent"
        onPress={onClose}
        aria-label={closeButtonAriaLabel}
        className="shrink-0"
      />
    </div>
  );
}
