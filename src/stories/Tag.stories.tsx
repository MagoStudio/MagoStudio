import { Tag } from "@components/Tag";
import { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Information/Tag",
  component: Tag,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Apply to"
  }
};

export const LongLabel: Story = {
  args: {
    children: "Applied to the input video reference"
  }
};
