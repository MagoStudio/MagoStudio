import { Switch } from "@components/Switch";
import { Text } from "@components/Text";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const AllVariantsPreview = () => {
  const [selected1, setSelected1] = useState(false);
  const [selected2, setSelected2] = useState(true);

  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="grid gap-6 w-[min(400px,90vw)]">
        <div className="grid gap-2">
          <Text component="div" variant="xs" color="glyph-secondary">
            Default (off)
          </Text>
          <Switch
            ariaLabel="Default switch"
            isSelected={selected1}
            onChange={setSelected1}
          />
        </div>

        <div className="grid gap-2">
          <Text component="div" variant="xs" color="glyph-secondary">
            Selected (on)
          </Text>
          <Switch
            ariaLabel="Selected switch"
            isSelected={selected2}
            onChange={setSelected2}
          />
        </div>

        <div className="grid gap-2">
          <Text component="div" variant="xs" color="glyph-secondary">
            Disabled (off)
          </Text>
          <Switch ariaLabel="Disabled switch" isSelected={false} isDisabled />
        </div>

        <div className="grid gap-2">
          <Text component="div" variant="xs" color="glyph-secondary">
            Disabled (on)
          </Text>
          <Switch
            ariaLabel="Disabled selected switch"
            isSelected={true}
            isDisabled
          />
        </div>

        <div className="grid gap-2">
          <Text component="div" variant="xs" color="glyph-secondary">
            With label (off)
          </Text>
          <Switch isSelected={false} label="Generate audio" />
        </div>

        <div className="grid gap-2">
          <Text component="div" variant="xs" color="glyph-secondary">
            With label (on)
          </Text>
          <Switch isSelected={true} label="Generate audio" />
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: "Inputs and control elements/Switch",
  component: Switch,
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    isSelected: { control: { type: "boolean" } },
    isDisabled: { control: { type: "boolean" } },
    label: { control: { type: "text" } }
  }
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => <AllVariantsPreview />
};

const InteractiveSwitch = (args: {
  isSelected?: boolean;
  isDisabled?: boolean;
  label?: string;
}) => {
  const [isSelected, setIsSelected] = useState(args.isSelected);
  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <Switch
        isSelected={isSelected}
        onChange={setIsSelected}
        isDisabled={args.isDisabled}
        label={args.label}
      />
    </div>
  );
};

export const Component: Story = {
  name: "Switch",
  args: {
    isSelected: false,
    isDisabled: false,
    label: "Generate audio"
  },
  render: (args) => <InteractiveSwitch {...args} />
};
