import { ComfyVersionStatus } from "@app/(authenticated)/(home)/components/Navbar/LocalSettings/ComfyVersionStatus";
import { LocalModelSettingsPanel } from "@app/(authenticated)/(home)/components/Navbar/LocalSettings/LocalModelSettingsPanel";
import { LocalTextProviderRadios } from "@app/(authenticated)/(home)/components/Navbar/LocalSettings/LocalTextProviderRadios";
import { Modal } from "@components/Modal";
import { Text } from "@components/Text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import type { LocalTextModelProvider } from "../../desktop/shared/contracts";

import {
  createLocalSetupFixture,
  type LocalSetupFixtureOptions
} from "./fixtures/createLocalSetupFixture";
import {
  createModelSettingsFixture,
  type ModelSettingsFixtureOptions
} from "./fixtures/createModelSettingsFixture";

const meta = {
  title: "Local setup/Model settings",
  component: LocalModelSettingsPanel,
  beforeEach: ({ parameters }) => {
    const previous = Object.getOwnPropertyDescriptor(window, "mago");
    Object.defineProperty(window, "mago", {
      configurable: true,
      value: {
        models: createModelSettingsFixture(
          parameters.modelSettingsFixture as
            | ModelSettingsFixtureOptions
            | undefined
        ).api,
        localSetup: createLocalSetupFixture(
          parameters.localSetupFixture as LocalSetupFixtureOptions | undefined
        )
      }
    });
    return () => {
      if (previous) Object.defineProperty(window, "mago", previous);
      else Reflect.deleteProperty(window, "mago");
    };
  },
  args: { endpoint: "http://127.0.0.1:8188" },
  render: function ModelSettingsStory(args) {
    const [provider, setProvider] = useState<LocalTextModelProvider>("local");
    return (
      <div className="min-h-screen bg-surface-background p-6">
        <div className="mx-auto flex h-[850px] w-full max-w-[600px] flex-col gap-3 overflow-y-auto rounded-3xl bg-surface-secondary p-4">
          <Text variant="md">Local settings · Models</Text>
          <Text variant="2xs" color="glyph-warning">
            Example data · real settings components with a fixture desktop
            bridge
          </Text>
          <ComfyVersionStatus endpoint={args.endpoint} />
          <LocalTextProviderRadios
            value={provider}
            onChange={setProvider}
            cloudDisabled={false}
          />
          <LocalModelSettingsPanel {...args} />
        </div>
      </div>
    );
  }
} satisfies Meta<typeof LocalModelSettingsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Unified: Story = {};
export const RecommendedFileMissingOnOldComfy: Story = {
  parameters: {
    modelSettingsFixture: {
      comfyVersion: "0.36.0",
      isRecommendedFileInstalled: false
    } satisfies ModelSettingsFixtureOptions
  }
};
export const InsideSettingsModal: Story = {
  render: function ModelSettingsInModalStory(args) {
    const [isModalOpen, setIsModalOpen] = useState(true);
    return (
      <div className="min-h-screen bg-surface-background p-6">
        {!isModalOpen && <Text variant="md">Settings modal closed</Text>}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Local settings"
          width="sm"
        >
          <div className="max-h-[70vh] overflow-y-auto">
            <LocalModelSettingsPanel {...args} />
          </div>
        </Modal>
      </div>
    );
  }
};
export const RecommendedFileDownloadingInsideSettingsModal: Story = {
  ...InsideSettingsModal,
  parameters: {
    modelSettingsFixture: {
      isRecommendedFileInstalled: false
    } satisfies ModelSettingsFixtureOptions,
    localSetupFixture: {
      initialDownload: {
        phase: "downloading",
        downloadedBytes: 644_245_094,
        totalBytes: 13_146_393_504,
        error: null
      }
    } satisfies LocalSetupFixtureOptions
  }
};
export const RecommendedFileDownloadInsideSettingsModal: Story = {
  ...InsideSettingsModal,
  parameters: {
    modelSettingsFixture: {
      isRecommendedFileInstalled: false
    } satisfies ModelSettingsFixtureOptions,
    localSetupFixture: {
      simulatedBytesPerSecond: 650_000_000
    } satisfies LocalSetupFixtureOptions
  }
};
export const PickedFileMissingNodes: Story = {
  parameters: {
    modelSettingsFixture: {
      areCustomFileNodesMissing: true
    } satisfies ModelSettingsFixtureOptions
  }
};
