import { Icon } from "@components/Icon";
import { Input } from "@components/Input";
import { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Inputs and control elements/Input",
  component: Input,
  parameters: {
    layout: "centered"
  },
  args: {
    "aria-label": "Frame",
    labelInside: "Frame",
    type: "number",
    defaultValue: 0,
    labelInsideEndAdornment: (
      <span className="flex items-center p-1 opacity-50">
        <Icon
          iconSet="16-filled"
          iconName="info"
          className="text-glyph-tertiary"
          aria-label="Frame information"
        />
      </span>
    )
  },
  decorators: [
    (Story) => (
      <div className="w-[266px]">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LabelInsideDefault: Story = {
  name: "Label inside — Default"
};

export const LabelInsideDisabled: Story = {
  name: "Label inside — Disabled",
  args: { disabled: true }
};
