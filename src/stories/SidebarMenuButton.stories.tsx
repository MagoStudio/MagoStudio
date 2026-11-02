import { Icon } from "@components/Icon";
import { SidebarMenuButton } from "@components/SidebarMenuButton";
import { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Components/SidebarMenuButton",
  component: SidebarMenuButton,
  parameters: {
    layout: "centered"
  },
  args: {
    children: "Queue"
  },
  decorators: [
    (Story) => (
      <div className="w-app-sidebar p-3 bg-surface-primary">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof SidebarMenuButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Icon iconSet="24" iconName="folder" />
        Queue
      </>
    )
  }
};

export const Active: Story = {
  args: { selected: true }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <SidebarMenuButton>Normal</SidebarMenuButton>
      <SidebarMenuButton selected>Active</SidebarMenuButton>
      <SidebarMenuButton disabled>Disabled</SidebarMenuButton>
      <SidebarMenuButton>
        <Icon iconSet="24" iconName="folder" />
        With Icon
      </SidebarMenuButton>
    </div>
  )
};
