import { Slider } from "@components/Slider";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { userEvent, within } from "storybook/test";

const meta = {
  title: "Inputs and control elements/Slider",
  component: Slider,
  parameters: {
    layout: "centered"
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    )
  ],
  args: {
    ariaLabel: "Brush size",
    value: 50,
    minValue: 0,
    maxValue: 100
  }
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const ForceGroupState = ({
  attribute,
  children
}: {
  attribute: string;
  children: React.ReactNode;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.querySelector("[data-rac]")?.setAttribute(attribute, "true");
  });
  return <div ref={ref}>{children}</div>;
};

export const SmallDefault: Story = {
  name: "Small (sm) / Default",
  args: { size: "sm" }
};

export const SmallHover: Story = {
  name: "Small (sm) / Hover",
  args: { size: "sm" },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("slider"));
  }
};

export const SmallDragging: Story = {
  name: "Small (sm) / Dragging",
  render: (args) => (
    <ForceGroupState attribute="data-dragging">
      <Slider {...args} />
    </ForceGroupState>
  ),
  args: { size: "sm" }
};

export const SmallDisabled: Story = {
  name: "Small (sm) / Disabled",
  args: { size: "sm", isDisabled: true }
};

export const SmallSkeleton: Story = {
  name: "Small (sm) / Skeleton",
  args: { size: "sm", skeleton: true }
};

export const MediumDefault: Story = {
  name: "Medium (md) / Default",
  args: { size: "md" }
};

export const MediumHover: Story = {
  name: "Medium (md) / Hover",
  args: { size: "md" },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("slider"));
  }
};

export const MediumDragging: Story = {
  name: "Medium (md) / Dragging",
  render: (args) => (
    <ForceGroupState attribute="data-dragging">
      <Slider {...args} />
    </ForceGroupState>
  ),
  args: { size: "md" }
};

export const MediumDisabled: Story = {
  name: "Medium (md) / Disabled",
  args: { size: "md", isDisabled: true }
};

export const MediumSkeleton: Story = {
  name: "Medium (md) / Skeleton",
  args: { size: "md", skeleton: true }
};
