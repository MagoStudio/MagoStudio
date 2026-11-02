import { ShotCard } from "@components/ShotCard";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const SAMPLE_THUMBNAIL_URL =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=200&h=320&fit=crop";
const SAMPLE_SHOT_NAME = "MRSFAB_ep103_sq0160_sh1440_anim_v020";
const SHORT_SHOT_NAME = "v020";

const ForceHovered = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current
      ?.querySelector("[data-rac]")
      ?.setAttribute("data-hovered", "true");
  });
  return <div ref={ref}>{children}</div>;
};

const meta = {
  title: "Cards/ShotCard",
  component: ShotCard,
  parameters: { layout: "centered" },
  args: {
    shotName: SAMPLE_SHOT_NAME,
    thumbnailUrl: SAMPLE_THUMBNAIL_URL,
    isSelected: false,
    isOpen: false,
    isLoading: false,
    hasThumbnailError: false,
    onToggle: () => {}
  }
} satisfies Meta<typeof ShotCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const Labelled = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col items-center gap-2">
    <span className="text-sm text-glyph-secondary">{label}</span>
    {children}
  </div>
);

export const Default: Story = {
  args: {}
};

export const Hover: Story = {
  render: (args) => (
    <ForceHovered>
      <ShotCard {...args} showFolderAndDeleteActions />
    </ForceHovered>
  ),
  args: {}
};

export const Selected: Story = {
  args: { isSelected: true }
};

export const Opened: Story = {
  args: { isOpen: true }
};

export const OpenAndSelected: Story = {
  name: "Open and Selected",
  args: { isOpen: true, isSelected: true }
};

export const InteractionWith: Story = {
  name: "Interaction with",
  args: { hasInteractionHighlight: true }
};

export const Loading: Story = {
  args: { isLoading: true, thumbnailUrl: undefined }
};

export const ErrorImg: Story = {
  args: { hasThumbnailError: true, thumbnailUrl: undefined }
};

export const Editing: Story = {
  name: "Edit state",
  args: { isEditing: true }
};

export const OpenWithShortName: Story = {
  name: "Opened, short name (no truncation)",
  args: { isOpen: true, shotName: SHORT_SHOT_NAME }
};

export const AllStates: Story = {
  name: "All Eight States",
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="flex flex-wrap gap-6 bg-surface-secondary p-6">
      <Labelled label="Default">
        <ShotCard {...args} />
      </Labelled>
      <Labelled label="Hover">
        <ForceHovered>
          <ShotCard {...args} showFolderAndDeleteActions />
        </ForceHovered>
      </Labelled>
      <Labelled label="Selected">
        <ShotCard {...args} isSelected />
      </Labelled>
      <Labelled label="Opened">
        <ShotCard {...args} isOpen />
      </Labelled>
      <Labelled label="Open and Selected">
        <ShotCard {...args} isOpen isSelected />
      </Labelled>
      <Labelled label="Interaction with">
        <ShotCard {...args} hasInteractionHighlight />
      </Labelled>
      <Labelled label="Loading">
        <ShotCard {...args} isLoading thumbnailUrl={undefined} />
      </Labelled>
      <Labelled label="Error Img">
        <ShotCard {...args} hasThumbnailError thumbnailUrl={undefined} />
      </Labelled>
    </div>
  ),
  args: {}
};

export const NameTreatments: Story = {
  name: "Name treatments: short, truncated, editing",
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="flex flex-wrap gap-6 bg-surface-secondary p-6">
      <Labelled label="Short name, opened (no truncation)">
        <ShotCard {...args} isOpen shotName={SHORT_SHOT_NAME} />
      </Labelled>
      <Labelled label="Long name, opened (truncated from the start)">
        <ShotCard {...args} isOpen shotName={SAMPLE_SHOT_NAME} />
      </Labelled>
      <Labelled label="Editing">
        <ShotCard {...args} isEditing shotName={SAMPLE_SHOT_NAME} />
      </Labelled>
    </div>
  ),
  args: {}
};
