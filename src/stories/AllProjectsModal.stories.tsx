import { AllProjectsModal } from "@home/components/dashboard/AllProjectsModal";
import { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Dashboard/AllProjectsModal",
  component: AllProjectsModal,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    onClose: () => {}
  }
} satisfies Meta<typeof AllProjectsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default (with projects)"
};

export const Loading: Story = {
  name: "Loading state"
};

export const Empty: Story = {
  name: "Empty state (no projects)"
};
