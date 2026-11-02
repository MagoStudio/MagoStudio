import { PlayButton } from "@components/PlayButton";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const meta = {
  title: "Buttons and links/PlayButton",
  component: PlayButton,
  parameters: {
    layout: "centered"
  },
  args: {
    isPlaying: false,
    onPress: () => {}
  }
} satisfies Meta<typeof PlayButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Compact: Story = {
  name: "Compact / Play",
  args: {
    variant: "compact",
    isPlaying: false
  }
};

export const CompactPlaying: Story = {
  name: "Compact / Pause",
  args: {
    variant: "compact",
    isPlaying: true
  }
};

export const Standalone: Story = {
  name: "Standalone / Play",
  args: {
    variant: "standalone",
    isPlaying: false
  }
};

export const StandalonePlaying: Story = {
  name: "Standalone / Pause",
  args: {
    variant: "standalone",
    isPlaying: true
  }
};

const ForceHovered = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current
      ?.querySelector("[data-rac]")
      ?.setAttribute("data-hovered", "true");
  });
  return <div ref={ref}>{children}</div>;
};

const headerCell =
  "px-4 py-2 text-left text-glyph-tertiary text-xs font-normal align-middle";
const cell = "px-4 py-3 align-middle";
const rowLabel =
  "px-4 py-3 text-glyph-warning text-xs font-normal whitespace-nowrap align-middle";

export const AllVariants: Story = {
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-glyph-stroke">
          <th className={headerCell} />
          <th className={headerCell}>Compact (56×32)</th>
          <th className={headerCell}>Standalone (80×66)</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Play</td>
          <td className={cell}>
            <PlayButton
              variant="compact"
              isPlaying={false}
              onPress={() => {}}
              aria-label="Play"
            />
          </td>
          <td className={cell}>
            <PlayButton
              variant="standalone"
              isPlaying={false}
              onPress={() => {}}
              aria-label="Play"
            />
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Pause</td>
          <td className={cell}>
            <PlayButton
              variant="compact"
              isPlaying={true}
              onPress={() => {}}
              aria-label="Pause"
            />
          </td>
          <td className={cell}>
            <PlayButton
              variant="standalone"
              isPlaying={true}
              onPress={() => {}}
              aria-label="Pause"
            />
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Hover</td>
          <td className={cell}>
            <ForceHovered>
              <PlayButton
                variant="compact"
                isPlaying={false}
                onPress={() => {}}
                aria-label="Play"
              />
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <PlayButton
                variant="standalone"
                isPlaying={false}
                onPress={() => {}}
                aria-label="Play"
              />
            </ForceHovered>
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Disabled</td>
          <td className={cell}>
            <PlayButton
              variant="compact"
              isPlaying={false}
              isDisabled
              onPress={() => {}}
              aria-label="Play"
            />
          </td>
          <td className={cell}>
            <PlayButton
              variant="standalone"
              isPlaying={false}
              isDisabled
              onPress={() => {}}
              aria-label="Play"
            />
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>No video</td>
          <td className={cell}>
            <PlayButton
              variant="compact"
              isPlaying={false}
              noVideo
              onPress={() => {}}
              aria-label="No video"
            />
          </td>
          <td className={cell}>
            <PlayButton
              variant="standalone"
              isPlaying={false}
              noVideo
              onPress={() => {}}
              aria-label="No video"
            />
          </td>
        </tr>
      </tbody>
    </table>
  )
};
