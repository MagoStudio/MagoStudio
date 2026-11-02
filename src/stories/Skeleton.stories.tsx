import { Skeleton } from "@components/Skeleton";
import { Text } from "@components/Text";
import { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Feedback/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToneColumn({
  title,
  baseTokenLabel,
  bandTokenLabel,
  tone
}: {
  title: string;
  baseTokenLabel: string;
  bandTokenLabel: string;
  tone: "default" | "tile";
}) {
  return (
    <div className="flex w-[216px] flex-col gap-2">
      <Text variant="sm" color="glyph-primary">
        {title}
      </Text>
      <Text variant="2xs" color="glyph-tertiary" className="leading-4">
        {baseTokenLabel}
      </Text>
      <Text variant="2xs" color="glyph-tertiary" className="leading-4">
        {bandTokenLabel}
      </Text>
      <Skeleton tone={tone} className="h-[377px] w-[216px] rounded" />
    </div>
  );
}

function ToneComparison() {
  return (
    <div className="flex gap-6 bg-surface-primary p-6">
      <ToneColumn
        title="default"
        baseTokenLabel="base: element-primary #292929"
        bandTokenLabel="band: element-primary-active #262626"
        tone="default"
      />
      <ToneColumn
        title="tile"
        baseTokenLabel="base: surface-secondary #1c1c1c"
        bandTokenLabel="band: element-primary #292929"
        tone="tile"
      />
    </div>
  );
}

export const Default: Story = {
  args: { className: "h-[377px] w-[216px] rounded" }
};

export const Tile: Story = {
  args: { tone: "tile", className: "h-[377px] w-[216px] rounded" }
};

export const ToneSideBySide: Story = {
  render: () => <ToneComparison />
};
