import { Alert } from "@components/Alert";
import { MainButton } from "@components/MainButton";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const meta = {
  title: "Messages/Alert",
  component: Alert,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

const GenerateBarWidth = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[380px]">{children}</div>
);

const RelaxedModeActions = () => (
  <MainButton variant="outlined" colorScheme="onColor">
    Switch to credits
  </MainButton>
);

const DailyLimitActions = () => (
  <div className="flex gap-2">
    <MainButton variant="outlined" colorScheme="onColor">
      Switch to Credits
    </MainButton>
    <MainButton variant="outlined" colorScheme="onColor">
      Buy credits
    </MainButton>
  </div>
);

const InsufficientCreditsActions = () => (
  <div className="flex gap-2">
    <MainButton variant="outlined" colorScheme="onColor">
      Switch to Relaxed mode
    </MainButton>
    <MainButton variant="outlined" colorScheme="onColor">
      Buy credits
    </MainButton>
  </div>
);

export const RelaxedMode: Story = {
  name: "Relaxed mode (blue, closable, one action)",
  render: () => (
    <GenerateBarWidth>
      <Alert color="surface-bg-100" actions={<RelaxedModeActions />}>
        In Relaxed mode, you can render only one video at a time
      </Alert>
    </GenerateBarWidth>
  )
};

export const DailyLimitReached: Story = {
  name: "Daily limit reached (red, closable, two actions)",
  render: () => (
    <GenerateBarWidth>
      <Alert color="element-error" actions={<DailyLimitActions />}>
        You&apos;ve reached your daily limit. It resets in 8 hours. You can
        still render using credits
      </Alert>
    </GenerateBarWidth>
  )
};

export const InsufficientCredits: Story = {
  name: "Insufficient credits (red, closable, two actions)",
  render: () => (
    <GenerateBarWidth>
      <Alert color="element-error" actions={<InsufficientCreditsActions />}>
        You don&apos;t have enough coins to make a generation
      </Alert>
    </GenerateBarWidth>
  )
};

export const Warning: Story = {
  name: "Warning (yellow, not closable)",
  render: () => (
    <GenerateBarWidth>
      <Alert alertVariant="warning" canClose={false}>
        This Model is not working in Relaxed mode
      </Alert>
    </GenerateBarWidth>
  )
};

export const WithTitle: Story = {
  name: "With a title",
  render: () => (
    <GenerateBarWidth>
      <Alert color="surface-bg-100" title="Relaxed mode">
        You can render only one video at a time
      </Alert>
    </GenerateBarWidth>
  )
};
