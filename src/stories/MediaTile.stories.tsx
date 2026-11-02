import { MediaTile } from "@components/MediaTile";
import { Text } from "@components/Text";
import { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Feedback/MediaTile",
  component: MediaTile,
  parameters: {
    layout: "centered"
  },
  args: {
    tilePresentation: "asset",
    className: "h-[201px] w-[201px]"
  }
} satisfies Meta<typeof MediaTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Asset: Story = {
  args: {
    thumbnailUrl: "https://picsum.photos/seed/mago-media-tile/400/400"
  }
};

export const Black: Story = {
  args: { tilePresentation: "black" }
};

export const Rendering: Story = {
  args: {
    tilePresentation: "rendering",
    centeredContent: (
      <img src="/flower.gif" alt="" className="h-[120px] w-[120px]" />
    )
  }
};

export const Shimmer: Story = {
  args: { tilePresentation: "shimmer" }
};

function PresentationColumn({
  title,
  tokenLabel,
  children
}: {
  title: string;
  tokenLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-[201px] flex-col gap-2">
      <Text variant="sm" color="glyph-primary">
        {title}
      </Text>
      <Text variant="2xs" color="glyph-tertiary" className="leading-4">
        {tokenLabel}
      </Text>
      {children}
    </div>
  );
}

export const AllPresentations: Story = {
  render: () => (
    <div className="flex gap-6 bg-surface-primary p-6">
      <PresentationColumn
        title="asset"
        tokenLabel="bg-surface-background #080808, image on top"
      >
        <MediaTile
          className="h-[201px] w-[201px]"
          tilePresentation="asset"
          thumbnailUrl="https://picsum.photos/seed/mago-media-tile/400/400"
        />
      </PresentationColumn>
      <PresentationColumn title="black" tokenLabel="glyph-invert-main #000000">
        <MediaTile className="h-[201px] w-[201px]" tilePresentation="black" />
      </PresentationColumn>
      <PresentationColumn
        title="rendering"
        tokenLabel="surface-background #080808 + /flower.gif"
      >
        <MediaTile
          className="h-[201px] w-[201px]"
          tilePresentation="rendering"
          centeredContent={
            <img src="/flower.gif" alt="" className="h-[120px] w-[120px]" />
          }
        />
      </PresentationColumn>
      <PresentationColumn
        title="shimmer"
        tokenLabel="surface-background base, Skeleton tone=tile (surface-secondary / element-primary)"
      >
        <MediaTile className="h-[201px] w-[201px]" tilePresentation="shimmer" />
      </PresentationColumn>
    </div>
  )
};
