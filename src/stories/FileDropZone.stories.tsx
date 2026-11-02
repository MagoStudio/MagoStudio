import { FileDropZone } from "@components/FileDropZone";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { userEvent } from "storybook/test";

const meta = {
  title: "Drag and drop/FileDropZone",
  component: FileDropZone,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof FileDropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

const StandaloneWidth = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[410px]">{children}</div>
);

const CompactWidth = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[324px]">{children}</div>
);

const buildPngFile = (width: number, height: number, name: string) =>
  new Promise<File>((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#57ba3e";
      context.fillRect(0, 0, width, height);
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to build a scratch PNG blob"));
        return;
      }
      resolve(new File([blob], name, { type: "image/png" }));
    }, "image/png");
  });

const ForceDropZoneState = ({
  attribute,
  children
}: {
  attribute: string;
  children: React.ReactNode;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.querySelector("[data-rac]")?.setAttribute(attribute, "true");
  });
  return <div ref={ref}>{children}</div>;
};

const COMPACT_MODE_ARGS = {
  value: ["storybook-fake-asset-id"],
  maxFileUpload: 2
};

const SMALL_SIZE_ARGS = {
  size: "small" as const,
  maxFileUpload: 9
};

const SMALL_SIZE_WITH_IMAGE_ARGS = {
  ...SMALL_SIZE_ARGS,
  value: ["storybook-fake-asset-id"]
};

const SmallWidth = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[362px]">{children}</div>
);

export const StandaloneDefault: Story = {
  name: "Standalone (Medium) / Default",
  render: (args) => (
    <StandaloneWidth>
      <FileDropZone {...args} />
    </StandaloneWidth>
  )
};

export const StandaloneHover: Story = {
  name: "Standalone (Medium) / Hover",
  render: (args) => (
    <StandaloneWidth>
      <FileDropZone {...args} />
    </StandaloneWidth>
  ),
  play: async ({ canvasElement }) => {
    const dropZone =
      canvasElement.querySelector('input[type="file"]')?.parentElement;
    if (dropZone instanceof HTMLElement) {
      await userEvent.hover(dropZone);
    }
  }
};

export const StandaloneDragOver: Story = {
  name: "Standalone (Medium) / Drag Over",
  render: (args) => (
    <StandaloneWidth>
      <ForceDropZoneState attribute="data-drop-target">
        <FileDropZone {...args} />
      </ForceDropZoneState>
    </StandaloneWidth>
  )
};

export const StandaloneUploading: Story = {
  name: "Standalone (Medium) / Uploading",
  render: (args) => (
    <StandaloneWidth>
      <FileDropZone {...args} />
    </StandaloneWidth>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = await buildPngFile(512, 512, "reference.png");
    await userEvent.upload(input, file);
  }
};

export const StandaloneError: Story = {
  name: "Standalone (Medium) / Error",
  render: (args) => (
    <StandaloneWidth>
      <FileDropZone {...args} />
    </StandaloneWidth>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = await buildPngFile(10, 10, "too-small.png");
    await userEvent.upload(input, file);
  }
};

export const StandaloneActiveError: Story = {
  name: "Standalone (Medium) / Active + Error",
  render: (args) => (
    <StandaloneWidth>
      <ForceDropZoneState attribute="data-drop-target">
        <FileDropZone {...args} />
      </ForceDropZoneState>
    </StandaloneWidth>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = await buildPngFile(10, 10, "too-small.png");
    await userEvent.upload(input, file);
  }
};

export const CompactDefault: Story = {
  name: "Compact (Small) / Default",
  args: COMPACT_MODE_ARGS,
  render: (args) => (
    <CompactWidth>
      <FileDropZone {...args} />
    </CompactWidth>
  )
};

export const CompactHover: Story = {
  name: "Compact (Small) / Hover",
  args: COMPACT_MODE_ARGS,
  render: (args) => (
    <CompactWidth>
      <FileDropZone {...args} />
    </CompactWidth>
  ),
  play: async ({ canvasElement }) => {
    const dropZone =
      canvasElement.querySelector('input[type="file"]')?.parentElement;
    if (dropZone instanceof HTMLElement) {
      await userEvent.hover(dropZone);
    }
  }
};

export const CompactDragOver: Story = {
  name: "Compact (Small) / Drag Over",
  args: COMPACT_MODE_ARGS,
  render: (args) => (
    <CompactWidth>
      <ForceDropZoneState attribute="data-drop-target">
        <FileDropZone {...args} />
      </ForceDropZoneState>
    </CompactWidth>
  )
};

export const CompactUploading: Story = {
  name: "Compact (Small) / Uploading",
  args: COMPACT_MODE_ARGS,
  render: (args) => (
    <CompactWidth>
      <FileDropZone {...args} />
    </CompactWidth>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = await buildPngFile(512, 512, "reference.png");
    await userEvent.upload(input, file);
  }
};

export const CompactError: Story = {
  name: "Compact (Small) / Error",
  args: COMPACT_MODE_ARGS,
  render: (args) => (
    <CompactWidth>
      <FileDropZone {...args} />
    </CompactWidth>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = await buildPngFile(10, 10, "too-small.png");
    await userEvent.upload(input, file);
  }
};

export const SmallDefault: Story = {
  name: "Size Small / Default (empty)",
  args: SMALL_SIZE_ARGS,
  render: (args) => (
    <SmallWidth>
      <FileDropZone {...args} />
    </SmallWidth>
  )
};

export const SmallHover: Story = {
  name: "Size Small / Hover",
  args: SMALL_SIZE_ARGS,
  render: (args) => (
    <SmallWidth>
      <FileDropZone {...args} />
    </SmallWidth>
  ),
  play: async ({ canvasElement }) => {
    const dropZone =
      canvasElement.querySelector('input[type="file"]')?.parentElement;
    if (dropZone instanceof HTMLElement) {
      await userEvent.hover(dropZone);
    }
  }
};

export const SmallDragOver: Story = {
  name: "Size Small / Drag Over",
  args: SMALL_SIZE_ARGS,
  render: (args) => (
    <SmallWidth>
      <ForceDropZoneState attribute="data-drop-target">
        <FileDropZone {...args} />
      </ForceDropZoneState>
    </SmallWidth>
  )
};

export const SmallUploading: Story = {
  name: "Size Small / Uploading",
  args: SMALL_SIZE_ARGS,
  render: (args) => (
    <SmallWidth>
      <FileDropZone {...args} />
    </SmallWidth>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = await buildPngFile(512, 512, "reference.png");
    await userEvent.upload(input, file);
  }
};

export const SmallError: Story = {
  name: "Size Small / Error",
  args: SMALL_SIZE_ARGS,
  render: (args) => (
    <SmallWidth>
      <FileDropZone {...args} />
    </SmallWidth>
  ),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = await buildPngFile(10, 10, "too-small.png");
    await userEvent.upload(input, file);
  }
};

export const SmallWithOneImage: Story = {
  name: "Size Small / With one image",
  args: SMALL_SIZE_WITH_IMAGE_ARGS,
  render: (args) => (
    <SmallWidth>
      <FileDropZone {...args} />
    </SmallWidth>
  )
};
