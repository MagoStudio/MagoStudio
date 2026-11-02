import { BulkRenderingRunImageShotCard } from "@home/components/SettingsEditor/BulkRenderingRunModal/BulkRenderingRunImageShotCard";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const LANDSCAPE_RESULT_IMAGE_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7fd0"/><stop offset="1" stop-color="#bcd9f2"/></linearGradient></defs><rect width="960" height="380" fill="url(#sky)"/><rect y="380" width="960" height="160" fill="#2f7a45"/><circle cx="700" cy="130" r="70" fill="#ffcc4d"/><text x="40" y="510" font-family="sans-serif" font-size="34" fill="#ffffff">landscape result</text></svg>`
  );

const PORTRAIT_RESULT_IMAGE_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960"><defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3f8f"/><stop offset="1" stop-color="#e8825a"/></linearGradient></defs><rect width="540" height="960" fill="url(#dusk)"/><circle cx="270" cy="330" r="90" fill="#ffe6a8"/><text x="30" y="910" font-family="sans-serif" font-size="34" fill="#ffffff">portrait result</text></svg>`
  );

const SAMPLE_PROMPT =
  "a beautiful matte painting, by alphonse mucha, high detail";

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
  <div className="flex w-[652px] flex-col items-start gap-2">
    <span className="text-sm text-glyph-tertiary">{label}</span>
    {children}
  </div>
);

const meta = {
  title: "Cards/BulkRenderingRunImageShotCard",
  component: BulkRenderingRunImageShotCard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <CardShell>
        <div className="w-[652px]">
          <Story />
        </div>
      </CardShell>
    )
  ],
  args: {
    shotId: "shot-1",
    shotName: "Shot name_Frame_number_01",
    cardState: "pending",
    tilePresentation: "black",
    completedStepCount: 0,
    totalStepCount: 8,
    resultImageUrl: undefined,
    prompt: SAMPLE_PROMPT,
    model: "gpt_image_2",
    referenceAssetIds: []
  }
} satisfies Meta<typeof BulkRenderingRunImageShotCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  name: "1. Not started — black tile",
  args: { cardState: "pending", tilePresentation: "black" }
};

export const Rendering: Story = {
  name: "2. Rendering",
  args: {
    cardState: "rendering",
    tilePresentation: "rendering",
    completedStepCount: 3,
    totalStepCount: 8
  }
};

export const DoneStillResolving: Story = {
  name: "3. Done, image still loading — shimmer",
  args: { cardState: "ready", tilePresentation: "shimmer" }
};

export const DoneSettledEmpty: Story = {
  name: "3b. Done, image request settled with nothing — black tile",
  args: { cardState: "ready", tilePresentation: "black" }
};

export const DoneLandscape: Story = {
  name: "4. Done, landscape result (letterboxed)",
  args: {
    cardState: "ready",
    tilePresentation: "image",
    resultImageUrl: LANDSCAPE_RESULT_IMAGE_URL
  }
};

export const DonePortrait: Story = {
  name: "5. Done, portrait result (fills the tile)",
  args: {
    cardState: "ready",
    tilePresentation: "image",
    resultImageUrl: PORTRAIT_RESULT_IMAGE_URL
  }
};

export const QualityFailure: Story = {
  name: "6. Failed the quality test",
  args: {
    cardState: "qualityFailure",
    tilePresentation: "qualityFailure",
    completedStepCount: 5,
    totalStepCount: 8
  }
};

export const InfrastructureFailure: Story = {
  name: "7. Failed for any other reason",
  args: {
    cardState: "infrastructureFailure",
    tilePresentation: "infrastructureFailure",
    completedStepCount: 2,
    totalStepCount: 8
  }
};

export const LongShotName: Story = {
  name: "8. Very long Shot name",
  args: {
    shotName: LONG_SHOT_NAME,
    cardState: "rendering",
    tilePresentation: "rendering",
    completedStepCount: 3,
    totalStepCount: 8
  }
};

export const NoSettings: Story = {
  name: "9. Run detail unavailable (empty prompt and model)",
  args: {
    cardState: "ready",
    tilePresentation: "image",
    resultImageUrl: LANDSCAPE_RESULT_IMAGE_URL,
    prompt: undefined,
    model: undefined
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
      <Labelled label="1. Not started — black tile">
        <BulkRenderingRunImageShotCard
          {...args}
          shotId="s1"
          cardState="pending"
          tilePresentation="black"
        />
      </Labelled>
      <Labelled label="2. Rendering">
        <BulkRenderingRunImageShotCard
          {...args}
          shotId="s2"
          cardState="rendering"
          tilePresentation="rendering"
          completedStepCount={3}
        />
      </Labelled>
      <Labelled label="3. Done, image still loading">
        <BulkRenderingRunImageShotCard
          {...args}
          shotId="s3"
          cardState="ready"
          tilePresentation="shimmer"
        />
      </Labelled>
      <Labelled label="4. Done, landscape (letterboxed)">
        <BulkRenderingRunImageShotCard
          {...args}
          shotId="s4"
          cardState="ready"
          tilePresentation="image"
          resultImageUrl={LANDSCAPE_RESULT_IMAGE_URL}
        />
      </Labelled>
      <Labelled label="5. Done, portrait (fills)">
        <BulkRenderingRunImageShotCard
          {...args}
          shotId="s5"
          cardState="ready"
          tilePresentation="image"
          resultImageUrl={PORTRAIT_RESULT_IMAGE_URL}
        />
      </Labelled>
      <Labelled label="6. Failed the quality test">
        <BulkRenderingRunImageShotCard
          {...args}
          shotId="s6"
          cardState="qualityFailure"
          tilePresentation="qualityFailure"
          completedStepCount={5}
        />
      </Labelled>
      <Labelled label="7. Failed for any other reason">
        <BulkRenderingRunImageShotCard
          {...args}
          shotId="s7"
          cardState="infrastructureFailure"
          tilePresentation="infrastructureFailure"
          completedStepCount={2}
        />
      </Labelled>
      <Labelled label="8. Very long Shot name">
        <BulkRenderingRunImageShotCard
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
