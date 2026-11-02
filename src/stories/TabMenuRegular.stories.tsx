import { TabMenuRegular } from "@components/TabMenuRegular";
import { Text } from "@components/Text";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import React from "react";
import { Tabs } from "react-aria-components/Tabs";

const meta = {
  title: "Navigation/TabMenuRegular",
  component: TabMenuRegular,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof TabMenuRegular>;

export default meta;
type Story = StoryObj<typeof meta>;

const RUN_VIEW_TABS = [
  { id: "image", name: "Image step" },
  { id: "video", name: "Video step" }
];

const StateRow = ({
  designSystemState,
  expected,
  children
}: {
  designSystemState: string;
  expected: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-6">
    <Text
      component="span"
      variant="xs"
      color="glyph-tertiary"
      className="w-20 shrink-0"
    >
      {designSystemState}
    </Text>
    <div className="w-44 shrink-0">{children}</div>
    <Text component="span" variant="xs" color="glyph-secondary">
      {expected}
    </Text>
  </div>
);

export const DesignSystemStates: Story = {
  args: { tabs: RUN_VIEW_TABS },
  render: () => (
    <div className="bg-surface-secondary p-8 w-[720px]">
      <Text component="div" variant="sm" color="glyph-primary" weight="bold">
        Tab / Regular — the three states published in the Mago Design System
      </Text>
      <Text
        component="div"
        variant="xs"
        color="glyph-secondary"
        className="mt-1 mb-6"
      >
        36px tall, padding 6px horizontal and 8px vertical. Label stays
        glyph-secondary #b8b8b8 in every state.
      </Text>

      <div className="flex flex-col gap-5">
        <StateRow
          designSystemState="Default + Selected"
          expected="Image step is Selected — label #b8b8b8, 2px underline #656fff along the bottom edge only. Video step is Default — no background, no underline, same label colour."
        >
          <Tabs selectedKey="image">
            <TabMenuRegular tabs={RUN_VIEW_TABS} />
          </Tabs>
        </StateRow>

        <StateRow
          designSystemState="Hover"
          expected="background element-primary-active #262626, label stays #b8b8b8. Point at a tab above — this control uses the CSS :hover pseudo-class, which no story can force."
        >
          <Tabs selectedKey="image">
            <TabMenuRegular tabs={RUN_VIEW_TABS} />
          </Tabs>
        </StateRow>
      </div>
    </div>
  )
};
