import { FolderRow } from "@components/FolderRow";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const ForceHovered = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current
      ?.querySelector('button[slot="trigger"]')
      ?.setAttribute("data-hovered", "true");
  });
  return <div ref={ref}>{children}</div>;
};

const meta = {
  title: "Cards/FolderRow",
  component: FolderRow,
  parameters: { layout: "centered" },
  args: {
    name: "01_02_Folder name",
    depth: 0,
    isExpanded: true,
    onExpandedChange: () => {},
    children: null
  }
} satisfies Meta<typeof FolderRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: { isExpanded: true }
};

export const Collapsed: Story = {
  args: { isExpanded: false }
};

export const Hover: Story = {
  render: (args) => (
    <ForceHovered>
      <FolderRow {...args} showFolderAndDeleteActions />
    </ForceHovered>
  ),
  args: {}
};

export const Selected: Story = {
  args: { isSelected: true }
};

export const BulkActionCollapsed: Story = {
  name: "Bulk action (collapsed)",
  args: { isExpanded: false, isBulkActionMode: true }
};

export const BulkActionExpanded: Story = {
  name: "Bulk action (expanded)",
  args: { isExpanded: true, isBulkActionMode: true }
};

export const NestedDepth: Story = {
  name: "Depth 2",
  args: { depth: 2 }
};

export const ProjectDefault: Story = {
  name: "Project / Default",
  args: { type: "project", name: "Untitled_01" }
};

export const ProjectHover: Story = {
  name: "Project / Hover",
  render: (args) => (
    <ForceHovered>
      <FolderRow {...args} type="project" name="Untitled_01" />
    </ForceHovered>
  ),
  args: {}
};

export const ProjectSelected: Story = {
  name: "Project / Selected",
  args: { type: "project", name: "Untitled_01", isSelected: true }
};

export const ProjectBulkAction: Story = {
  name: "Project / Bulk action",
  args: { type: "project", name: "Untitled_01", isBulkActionMode: true }
};

export const ProjectDefaultShared: Story = {
  name: "Project / Default Shared",
  args: { type: "project", name: "Untitled_01", isShared: true }
};

export const ProjectSharedHover: Story = {
  name: "Project / Shared Hover",
  render: (args) => (
    <ForceHovered>
      <FolderRow {...args} type="project" name="Untitled_01" isShared />
    </ForceHovered>
  ),
  args: {}
};

const Labelled = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-glyph-secondary">{label}</span>
    {children}
  </div>
);

export const AllStatesAndDepths: Story = {
  name: "All Design System States (Type: Folder), Collapsed and Expanded",
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="flex w-80 flex-col gap-4 bg-surface-secondary p-4">
      <Labelled label="Default, collapsed">
        <FolderRow {...args} isExpanded={false} />
      </Labelled>
      <Labelled label="Default, expanded">
        <FolderRow {...args} isExpanded />
      </Labelled>
      <Labelled label="Hover, collapsed">
        <ForceHovered>
          <FolderRow {...args} isExpanded={false} showFolderAndDeleteActions />
        </ForceHovered>
      </Labelled>
      <Labelled label="Hover, expanded">
        <ForceHovered>
          <FolderRow {...args} isExpanded showFolderAndDeleteActions />
        </ForceHovered>
      </Labelled>
      <Labelled label="Selected, collapsed">
        <FolderRow {...args} isExpanded={false} isSelected />
      </Labelled>
      <Labelled label="Selected, expanded">
        <FolderRow {...args} isExpanded isSelected />
      </Labelled>
      <Labelled label="Bulk action, collapsed">
        <FolderRow {...args} isExpanded={false} isBulkActionMode />
      </Labelled>
      <Labelled label="Bulk action, expanded">
        <FolderRow {...args} isExpanded isBulkActionMode />
      </Labelled>
      <Labelled label="Depth 1, expanded">
        <FolderRow {...args} isExpanded depth={1} />
      </Labelled>
      <Labelled label="Depth 2, expanded">
        <FolderRow {...args} isExpanded depth={2} />
      </Labelled>
    </div>
  ),
  args: {}
};

export const AllProjectStates: Story = {
  name: "All Design System States (Type: Project)",
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="flex w-80 flex-col gap-4 bg-surface-secondary p-4">
      <Labelled label="Default">
        <FolderRow {...args} type="project" name="Untitled_01" />
      </Labelled>
      <Labelled label="Hover">
        <ForceHovered>
          <FolderRow {...args} type="project" name="Untitled_01" />
        </ForceHovered>
      </Labelled>
      <Labelled label="Selected">
        <FolderRow {...args} type="project" name="Untitled_01" isSelected />
      </Labelled>
      <Labelled label="Bulk action">
        <FolderRow
          {...args}
          type="project"
          name="Untitled_01"
          isBulkActionMode
        />
      </Labelled>
      <Labelled label="Default Shared">
        <FolderRow {...args} type="project" name="Untitled_01" isShared />
      </Labelled>
      <Labelled label="Shared Hover">
        <ForceHovered>
          <FolderRow {...args} type="project" name="Untitled_01" isShared />
        </ForceHovered>
      </Labelled>
    </div>
  ),
  args: {}
};
