import { Switcher, SwitcherOption } from "@components/Switcher";
import { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

type Option = "prompt" | "points" | "prompt_and_visual_selection";

const options: SwitcherOption<Option>[] = [
  { label: "Prompt", value: "prompt" },
  { label: "Points", value: "points" },
  { label: "Prompt+Points", value: "prompt_and_visual_selection" }
];

const SwitcherWrapper: React.FC<{
  fullWidth?: boolean;
  initial?: Option;
}> = ({ fullWidth, initial = "prompt" }) => {
  const [value, setValue] = useState<Option>(initial);
  return (
    <div style={{ width: fullWidth ? 360 : undefined }}>
      <Switcher
        options={options}
        onOptionClick={(o) => setValue(o.value)}
        isOptionSelected={(o) => o.value === value}
        fullWidth={fullWidth}
      />
    </div>
  );
};

const meta = {
  title: "Inputs/Switcher",
  component: SwitcherWrapper,
  parameters: { layout: "centered" }
} satisfies Meta<typeof SwitcherWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { initial: "prompt" } };

export const SecondSelected: Story = {
  name: "Second option selected",
  args: { initial: "points" }
};

export const ThirdSelected: Story = {
  name: "Third option selected",
  args: { initial: "prompt_and_visual_selection" }
};

export const FullWidth: Story = {
  name: "Full width",
  args: { fullWidth: true, initial: "prompt_and_visual_selection" }
};
