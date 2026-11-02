import { BulkRenderingRunVideoShotCard } from "@home/components/SettingsEditor/BulkRenderingRunModal/BulkRenderingRunVideoShotCard";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const PORTRAIT_RESULT_VIDEO_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960"><defs><linearGradient id="neon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b2027"/><stop offset="1" stop-color="#0f6b3f"/></linearGradient></defs><rect width="540" height="960" fill="url(#neon)"/><rect x="60" y="300" width="420" height="14" fill="#3dff8f"/><text x="30" y="910" font-family="sans-serif" font-size="34" fill="#ffffff">portrait result</text></svg>`
  );

const LANDSCAPE_RESULT_VIDEO_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><defs><linearGradient id="wide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#241b3a"/><stop offset="1" stop-color="#6b2f5a"/></linearGradient></defs><rect width="960" height="540" fill="url(#wide)"/><circle cx="480" cy="270" r="90" fill="#ffd166"/><text x="40" y="500" font-family="sans-serif" font-size="34" fill="#ffffff">landscape result</text></svg>`
  );

const REFERENCE_FRAME_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960"><rect width="540" height="960" fill="#1b1b28"/><circle cx="270" cy="360" r="80" fill="#8fb3ff"/><text x="30" y="910" font-family="sans-serif" font-size="34" fill="#ffffff">Frame 0</text></svg>`
  );

const SAMPLE_PROMPT =
  "A man in his 40s to 50s, with light skin, short curly grey hair, and a serious expression, wearing a long black double-breasted coat.";

const LONG_SHOT_NAME =
  "02_07_Anna_and_friends_walking_through_the_market_at_golden_hour_take_04";

const CardShell = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-surface-secondary p-6">{children}</div>
);

const Labelled = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex w-[435px] flex-col items-start gap-2">
    <span className="text-sm text-glyph-tertiary">{label}</span>
    {children}
  </div>
);

const meta = {
  title: "Cards/BulkRenderingRunVideoShotCard",
  component: BulkRenderingRunVideoShotCard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <CardShell>
        <div className="w-[435px]">
          <Story />
        </div>
      </CardShell>
    )
  ],
  args: {
    shotId: "shot-1",
    shotName: "Shot name_Frame_number_01",
    cardState: "pending",
    tilePresentation: "shimmer",
    referenceFrameTilePresentation: "image",
    completedStepCount: 0,
    totalStepCount: 7,
    resultThumbnailUrl: undefined,
    resultVideoUrl: undefined,
    referenceFrameUrl: REFERENCE_FRAME_URL,
    prompt: SAMPLE_PROMPT,
    isSettingsOverridden: false,
    isSettingsRowDisabled: false,
    isSettingsPanelOpen: false,
    onOpenSettingsPanel: () => {}
  }
} satisfies Meta<typeof BulkRenderingRunVideoShotCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  name: "1. Not started — chip reads Original, no status",
  args: {
    cardState: "pending",
    tilePresentation: "shimmer",
    resultThumbnailUrl: REFERENCE_FRAME_URL
  }
};

export const NotStartedNoPreview: Story = {
  name: "1b. Not started, no Shot preview — black tile",
  args: {
    cardState: "pending",
    tilePresentation: "black",
    resultThumbnailUrl: undefined
  }
};

export const Rendering: Story = {
  name: "2. Rendering — placeholder glyph",
  args: {
    cardState: "rendering",
    tilePresentation: "rendering",
    completedStepCount: 3,
    totalStepCount: 7
  }
};

export const RenderingEmptyTile: Story = {
  name: "3. Rendering — empty tile",
  args: {
    cardState: "rendering",
    tilePresentation: "shimmer",
    completedStepCount: 1,
    totalStepCount: 7
  }
};

export const ReferenceFrameGenerating: Story = {
  name: "3b. Frame 0 not generated yet — black tile",
  args: {
    cardState: "pending",
    tilePresentation: "shimmer",
    referenceFrameTilePresentation: "black",
    resultThumbnailUrl: REFERENCE_FRAME_URL,
    referenceFrameUrl: undefined
  }
};

export const ReferenceFrameLoading: Story = {
  name: "3c. Frame 0 known but still fetching — shimmer",
  args: {
    cardState: "pending",
    tilePresentation: "shimmer",
    referenceFrameTilePresentation: "shimmer",
    resultThumbnailUrl: REFERENCE_FRAME_URL,
    referenceFrameUrl: undefined
  }
};

const SAMPLE_PLAYABLE_VIDEO_URL =
  "data:video/mp4;base64,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";

export const DonePlayable: Story = {
  name: "4a. Done — the result plays in the tile",
  args: {
    cardState: "ready",
    tilePresentation: "video",
    completedStepCount: 7,
    totalStepCount: 7,
    resultThumbnailUrl: PORTRAIT_RESULT_VIDEO_URL,
    resultVideoUrl: SAMPLE_PLAYABLE_VIDEO_URL
  }
};

export const DonePortrait: Story = {
  name: "4. Done — portrait result fills the tile",
  args: {
    cardState: "ready",
    tilePresentation: "video",
    completedStepCount: 7,
    totalStepCount: 7,
    resultThumbnailUrl: PORTRAIT_RESULT_VIDEO_URL
  }
};

export const DoneLandscape: Story = {
  name: "5. Done — landscape result letterboxes",
  args: {
    cardState: "ready",
    tilePresentation: "video",
    completedStepCount: 7,
    totalStepCount: 7,
    resultThumbnailUrl: LANDSCAPE_RESULT_VIDEO_URL
  }
};

export const DoneStillResolving: Story = {
  name: "6. Done — thumbnail not resolved yet, shimmer",
  args: {
    cardState: "ready",
    tilePresentation: "shimmer",
    completedStepCount: 7,
    totalStepCount: 7
  }
};

export const DoneSettledEmpty: Story = {
  name: "6b. Done — result request settled with nothing, black tile",
  args: {
    cardState: "ready",
    tilePresentation: "black",
    completedStepCount: 7,
    totalStepCount: 7
  }
};

export const QualityFailure: Story = {
  name: "7. Failed the quality test",
  args: {
    cardState: "qualityFailure",
    tilePresentation: "qualityFailure",
    completedStepCount: 7,
    totalStepCount: 7
  }
};

export const InfrastructureFailure: Story = {
  name: "8. Failed for any other reason",
  args: {
    cardState: "infrastructureFailure",
    tilePresentation: "infrastructureFailure",
    completedStepCount: 2,
    totalStepCount: 7
  }
};

export const LongShotName: Story = {
  name: "9. Very long Shot name",
  args: {
    shotName: LONG_SHOT_NAME,
    cardState: "rendering",
    tilePresentation: "rendering",
    completedStepCount: 3,
    totalStepCount: 7
  }
};

export const NoSettings: Story = {
  name: "10. Run detail unavailable — empty prompt",
  args: {
    cardState: "ready",
    tilePresentation: "video",
    completedStepCount: 7,
    totalStepCount: 7,
    resultThumbnailUrl: PORTRAIT_RESULT_VIDEO_URL,
    prompt: undefined
  }
};

export const NoReferenceFrame: Story = {
  name: "11. Reference frame unresolved",
  args: {
    cardState: "ready",
    tilePresentation: "video",
    completedStepCount: 7,
    totalStepCount: 7,
    resultThumbnailUrl: PORTRAIT_RESULT_VIDEO_URL,
    referenceFrameUrl: undefined
  }
};

export const AllStates: Story = {
  name: "All states",
  decorators: [
    (Story) => (
      <CardShell>
        <Story />
      </CardShell>
    )
  ],
  render: (args) => (
    <div className="flex flex-wrap items-start gap-10">
      <Labelled label="1. Not started">
        <BulkRenderingRunVideoShotCard
          {...args}
          shotId="s1"
          cardState="pending"
          tilePresentation="shimmer"
          resultThumbnailUrl={REFERENCE_FRAME_URL}
        />
      </Labelled>
      <Labelled label="2. Rendering">
        <BulkRenderingRunVideoShotCard
          {...args}
          shotId="s2"
          cardState="rendering"
          tilePresentation="rendering"
          completedStepCount={3}
        />
      </Labelled>
      <Labelled label="3. Rendering, empty tile">
        <BulkRenderingRunVideoShotCard
          {...args}
          shotId="s3"
          cardState="rendering"
          tilePresentation="shimmer"
          completedStepCount={1}
        />
      </Labelled>
      <Labelled label="4. Done, portrait">
        <BulkRenderingRunVideoShotCard
          {...args}
          shotId="s4"
          cardState="ready"
          tilePresentation="video"
          completedStepCount={7}
          resultThumbnailUrl={PORTRAIT_RESULT_VIDEO_URL}
        />
      </Labelled>
      <Labelled label="5. Done, landscape">
        <BulkRenderingRunVideoShotCard
          {...args}
          shotId="s5"
          cardState="ready"
          tilePresentation="video"
          completedStepCount={7}
          resultThumbnailUrl={LANDSCAPE_RESULT_VIDEO_URL}
        />
      </Labelled>
      <Labelled label="6. Failed the quality test">
        <BulkRenderingRunVideoShotCard
          {...args}
          shotId="s6"
          cardState="qualityFailure"
          tilePresentation="qualityFailure"
          completedStepCount={7}
        />
      </Labelled>
      <Labelled label="7. Failed for any other reason">
        <BulkRenderingRunVideoShotCard
          {...args}
          shotId="s7"
          cardState="infrastructureFailure"
          tilePresentation="infrastructureFailure"
          completedStepCount={2}
        />
      </Labelled>
      <Labelled label="8. Very long Shot name">
        <BulkRenderingRunVideoShotCard
          {...args}
          shotId="s8"
          shotName={LONG_SHOT_NAME}
          cardState="rendering"
          tilePresentation="rendering"
          completedStepCount={3}
        />
      </Labelled>
    </div>
  ),
  args: {}
};
