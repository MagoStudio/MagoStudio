import { Textarea } from "@components/Textarea";
import { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

const meta = {
  title: "Inputs and control elements/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered"
  },
  args: {
    "aria-label": "Prompt"
  }
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: "A rendered prompt" }
};

export const Hint: Story = {
  args: { placeholder: "Write your prompt here" }
};

export const Hover: Story = {
  args: { defaultValue: "A rendered prompt" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("textbox"));
  }
};

export const Active: Story = {
  name: "Active (Focus)",
  args: { defaultValue: "A rendered prompt" },
  play: async () => {
    await userEvent.tab();
  }
};

export const Disabled: Story = {
  args: { defaultValue: "A rendered prompt", disabled: true }
};

export const ErrorState: Story = {
  args: { severity: "error", defaultValue: "Broken prompt" }
};

export const Skeleton: Story = {
  args: { skeleton: true },
  decorators: [
    (Story) => (
      <div className="w-[428px]">
        <Story />
      </div>
    )
  ]
};
