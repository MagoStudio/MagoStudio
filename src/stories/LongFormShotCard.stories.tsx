import { ShotFailureOutcome } from "@domains/longFormRun/utils/deriveShotFailureOutcome";
import { LongFormShotCard } from "@home/long-form/[accessKey]/components/LongFormShotCard";
import { AssetStatus } from "@schemas/asset";
import { LayerType } from "@schemas/layer";
import { Meta, StoryObj } from "@storybook/react-vite";
import { createAsset } from "@tests/factories/asset";
import { createClip } from "@tests/factories/clip";
import { createLayer } from "@tests/factories/layer";
import React from "react";
import { screen, userEvent, within } from "storybook/test";

const READY_RENDER_TRACK = createLayer({
  type: LayerType.RENDER,
  clips: [
    createClip({
      asset: createAsset({ data: { queue_status: AssetStatus.FINISHED } })
    })
  ]
});

const ERRORED_WITH_MESSAGE: ShotFailureOutcome = {
  outcome: "errored",
  message:
    "The render pipeline ran out of GPU memory while stitching the final segment."
};

const ERRORED_NO_MESSAGE: ShotFailureOutcome = {
  outcome: "errored",
  message: undefined
};

const CANCELLED_WITH_MESSAGE: ShotFailureOutcome = {
  outcome: "cancelled",
  message: "Cancelled by the pipeline before the render queue started."
};

const ERRORED_LONG_MESSAGE: ShotFailureOutcome = {
  outcome: "errored",
  message:
    "The backend returned a very long, unformatted diagnostic string that keeps going well past what a single line of the card header can hold, so it has to be truncated with an ellipsis rather than wrapping the card wider or forcing the label off the edge."
};

const CardShell = ({ children }: { children: React.ReactNode }) => (
  <div className="max-h-[560px] overflow-auto bg-surface-secondary p-6">
    {children}
  </div>
);

const Labelled = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col items-start gap-2">
    <span className="text-sm text-glyph-secondary">{label}</span>
    {children}
  </div>
);

const meta = {
  title: "Cards/LongFormShotCard",
  component: LongFormShotCard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <CardShell>
        <Story />
      </CardShell>
    )
  ],
  args: {
    index: 0,
    label: "Shot_01",
    cardState: "notStarted",
    renderTrack: undefined,
    failure: undefined,
    onVideoPlay: () => {}
  }
} satisfies Meta<typeof LongFormShotCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotStarted: Story = {
  args: { cardState: "notStarted" }
};

export const Rendering: Story = {
  args: { cardState: "rendering" }
};

export const Ready: Story = {
  args: { cardState: "ready", renderTrack: READY_RENDER_TRACK }
};

export const ErroredWithMessage: Story = {
  name: "Errored, with a backend message",
  args: { cardState: "failed", failure: ERRORED_WITH_MESSAGE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByTestId("long-form-shot-card-info"));
    await screen.findByRole("tooltip");
  }
};

export const ErroredNoMessage: Story = {
  name: "Errored, with no backend message",
  args: { cardState: "failed", failure: ERRORED_NO_MESSAGE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByTestId("long-form-shot-card-info"));
    await screen.findByRole("tooltip");
  }
};

export const CancelledWithMessage: Story = {
  name: "Cancelled, with a backend message",
  args: { cardState: "failed", failure: CANCELLED_WITH_MESSAGE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByTestId("long-form-shot-card-info"));
    await screen.findByRole("tooltip");
  }
};

export const ErroredLongMessage: Story = {
  name: "Errored, with a very long message",
  args: { cardState: "failed", failure: ERRORED_LONG_MESSAGE }
};

export const AllStates: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-8 bg-surface-secondary p-6">
      <Labelled label="Not started">
        <LongFormShotCard {...args} index={0} cardState="notStarted" />
      </Labelled>
      <Labelled label="Rendering">
        <LongFormShotCard {...args} index={1} cardState="rendering" />
      </Labelled>
      <Labelled label="Ready">
        <LongFormShotCard
          {...args}
          index={2}
          cardState="ready"
          renderTrack={READY_RENDER_TRACK}
        />
      </Labelled>
      <Labelled label="Errored, with a backend message">
        <LongFormShotCard
          {...args}
          index={3}
          cardState="failed"
          failure={ERRORED_WITH_MESSAGE}
        />
      </Labelled>
      <Labelled label="Errored, with no backend message">
        <LongFormShotCard
          {...args}
          index={4}
          cardState="failed"
          failure={ERRORED_NO_MESSAGE}
        />
      </Labelled>
      <Labelled label="Cancelled, with a backend message">
        <LongFormShotCard
          {...args}
          index={5}
          cardState="failed"
          failure={CANCELLED_WITH_MESSAGE}
        />
      </Labelled>
      <Labelled label="Errored, with a very long message">
        <LongFormShotCard
          {...args}
          index={6}
          cardState="failed"
          failure={ERRORED_LONG_MESSAGE}
        />
      </Labelled>
    </div>
  ),
  args: {}
};
