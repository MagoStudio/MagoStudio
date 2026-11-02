import { ProgressBar } from "@components/ProgressBar";
import { Text } from "@components/Text";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { GlyphPalette } from "@styles/types";
import { Fragment } from "react";

const meta = {
  title: "Feedback/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const DESIGN_SYSTEM_STATES = [
  {
    designSystemState: "Pending",
    label: "Queued",
    color: "glyph-tertiary" as GlyphPalette,
    hex: "#858585",
    progress: 0,
    glow: "none (empty track)"
  },
  {
    designSystemState: "In queue",
    label: "Queue: Next",
    color: "glyph-tertiary" as GlyphPalette,
    hex: "#858585",
    progress: 0,
    glow: "none (empty track)"
  },
  {
    designSystemState: "In progress",
    label: "Image step",
    color: "glyph-warning" as GlyphPalette,
    hex: "#c2b25e",
    progress: 35,
    glow: "0 0 14px rgba(255,237,144,0.6)"
  },
  {
    designSystemState: "Finished",
    label: "Done",
    color: "glyph-success" as GlyphPalette,
    hex: "#00ff66",
    progress: 100,
    glow: "0 0 12px rgba(51,255,0,0.62)"
  },
  {
    designSystemState: "Error",
    label: "Failed",
    color: "glyph-error" as GlyphPalette,
    hex: "#e54545",
    progress: 100,
    glow: "0 0 12px rgba(229,69,69,0.62)"
  }
];

const DriftedProgressBar = ({
  progress,
  color
}: {
  progress: number;
  color: GlyphPalette;
}) => (
  <div className="relative w-full min-w-20 h-3 rounded-md bg-element-tertiary overflow-hidden">
    <div
      className="absolute top-1 left-1 h-1 rounded-sm transition-all ease-in-out"
      style={{
        width: `calc(${progress}% - 8px)`,
        backgroundColor: `var(--color-${color})`,
        boxShadow: `0 0 14px 1px var(--color-${color}-opacity-80)`
      }}
    />
  </div>
);

export const DesignSystemStates: Story = {
  args: { progress: 35, color: "glyph-warning" },
  render: () => (
    <div className="bg-surface-secondary p-8 w-[760px]">
      <Text component="div" variant="sm" color="glyph-primary" weight="bold">
        Progress Line — the five states published in the Mago Design System
      </Text>
      <Text
        component="div"
        variant="xs"
        color="glyph-secondary"
        className="mt-1 mb-6"
      >
        Track 80x12, radius 30, element-tertiary #303030. Fill 4px tall, radius
        20.
      </Text>

      <div className="flex flex-col gap-5">
        {DESIGN_SYSTEM_STATES.map((state) => (
          <div
            key={state.designSystemState}
            className="flex items-center gap-4"
          >
            <Text
              component="span"
              variant="xs"
              color="glyph-tertiary"
              className="w-24 shrink-0"
            >
              {state.designSystemState}
            </Text>

            <div className="flex shrink-0 items-center gap-1 w-48">
              <Text
                component="span"
                variant="2xs"
                color={state.color}
                className="leading-4"
              >
                {state.label}
              </Text>
              <div className="w-20">
                <ProgressBar progress={state.progress} color={state.color} />
              </div>
            </div>

            <Text component="span" variant="xs" color="glyph-secondary">
              {state.color} {state.hex} — glow {state.glow}
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
};

export const PulsingFill: Story = {
  args: { progress: 35, color: "glyph-warning" },
  render: () => (
    <div className="bg-surface-secondary p-8 w-[520px]">
      <Text component="div" variant="sm" color="glyph-primary" weight="bold">
        In-progress fill — static vs pulsing
      </Text>
      <Text
        component="div"
        variant="xs"
        color="glyph-secondary"
        className="mt-1 mb-6"
      >
        The Bulk upload progress modal's in-progress row requires an animating
        indicator, not a static one. `isFillPulsing` reuses the repo's existing
        `animate-status-pulse` keyframe (also used by the FileDropZone uploading
        pill's dot) rather than a new animation. Every other consumer of
        ProgressBar is unaffected — the prop defaults to false.
      </Text>

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Text
            component="span"
            variant="xs"
            color="glyph-tertiary"
            className="w-32 shrink-0"
          >
            Static (default)
          </Text>
          <div className="w-20">
            <ProgressBar progress={35} color="glyph-warning" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Text
            component="span"
            variant="xs"
            color="glyph-tertiary"
            className="w-32 shrink-0"
          >
            Pulsing (isFillPulsing)
          </Text>
          <div className="w-20">
            <ProgressBar progress={35} color="glyph-warning" isFillPulsing />
          </div>
        </div>
      </div>
    </div>
  )
};

export const BeforeAndAfterDesignSystemFix: Story = {
  args: { progress: 60, color: "glyph-warning" },
  render: () => (
    <div className="bg-surface-secondary p-8 w-[680px]">
      <Text component="div" variant="sm" color="glyph-primary" weight="bold">
        Before (drifted) vs after (matches the Design System)
      </Text>
      <Text
        component="div"
        variant="xs"
        color="glyph-secondary"
        className="mt-1 mb-6"
      >
        Before: radius 6px / 2px, glow derived as colour at 80% and clipped by
        overflow-hidden. After: pill radii, the exact glow the Design System
        draws, glow no longer clipped.
      </Text>

      <div className="grid grid-cols-[6rem_10rem_10rem] items-center gap-y-6">
        <div />
        <Text component="span" variant="xs" color="glyph-tertiary">
          Before
        </Text>
        <Text component="span" variant="xs" color="glyph-tertiary">
          After
        </Text>

        {DESIGN_SYSTEM_STATES.filter((state) => state.progress > 0).map(
          (state) => (
            <Fragment key={state.designSystemState}>
              <Text component="span" variant="xs" color={state.color}>
                {state.color}
              </Text>
              <div className="w-20">
                <DriftedProgressBar
                  progress={state.progress}
                  color={state.color}
                />
              </div>
              <div className="w-20">
                <ProgressBar progress={state.progress} color={state.color} />
              </div>
            </Fragment>
          )
        )}
      </div>
    </div>
  )
};
