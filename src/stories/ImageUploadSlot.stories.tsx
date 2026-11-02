import { Text } from "@components/Text";
import { ImageUploadSlot } from "@home/components/renderSettingsComponents/ImageUploadSlot";
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const noop = async () => {};

const meta = {
  title: "Drag and drop/Small",
  component: ImageUploadSlot,
  parameters: { layout: "centered" }
} satisfies Meta<typeof ImageUploadSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

const Frame: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children
}) => (
  <div className="flex flex-col items-center gap-3">
    <Text variant="2xs" color="glyph-tertiary">
      {label}
    </Text>
    <div className="flex items-center justify-center">{children}</div>
  </div>
);

const ForceDropTarget = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current
      ?.querySelector("[data-rac]")
      ?.setAttribute("data-drop-target", "true");
  });
  return <div ref={ref}>{children}</div>;
};

export const States: Story = {
  args: {
    assetId: undefined,
    onUpload: noop,
    onDelete: () => {},
    onClearError: () => {}
  },
  render: () => (
    <div className="grid grid-cols-4 gap-4 p-6 bg-surface-bg-300">
      <Frame label="Empty">
        <ImageUploadSlot
          onUpload={noop}
          onDelete={() => {}}
          onClearError={() => {}}
        />
      </Frame>
      <Frame label="Drag active (hover)">
        <ForceDropTarget>
          <ImageUploadSlot
            onUpload={noop}
            onDelete={() => {}}
            onClearError={() => {}}
          />
        </ForceDropTarget>
      </Frame>
      <Frame label="Uploading 30%">
        <ImageUploadSlot
          onUpload={noop}
          onDelete={() => {}}
          onClearError={() => {}}
          uploadProgress={30}
        />
      </Frame>
      <Frame label="Error">
        <ImageUploadSlot
          onUpload={noop}
          onDelete={() => {}}
          onClearError={() => {}}
          uploadError="upload_button_file_corrupted"
        />
      </Frame>
    </div>
  )
};

export const Empty: Story = {
  args: {
    onUpload: noop,
    onDelete: () => {},
    onClearError: () => {},
    fluidWidth: true
  }
};

export const Uploading: Story = {
  args: {
    onUpload: noop,
    onDelete: () => {},
    onClearError: () => {},
    uploadProgress: 30,
    fluidWidth: true
  }
};

export const Error: Story = {
  args: {
    onUpload: noop,
    onDelete: () => {},
    onClearError: () => {},
    uploadError: "upload_button_file_corrupted",
    fluidWidth: true
  }
};
