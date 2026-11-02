import { BulkRenderingShotSettingsPanel } from "@home/components/SettingsEditor/BulkRenderingDraftModal/BulkRenderingShotSettingsPanel";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { magoV4_1_0RenderModel } from "@models/video/magoV4_1_0VideoModel";
import { Meta, StoryObj } from "@storybook/react-vite";

const videoModel = magoV4_1_0RenderModel;
const values = extractDefaultVideoSettings(videoModel, false);

const meta = {
  title: "Modals/BulkRenderingShotSettingsPanel",
  component: BulkRenderingShotSettingsPanel,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    shotId: "shot-1",
    shotName: "Shot name_Frame_number_01",
    videoModel,
    values,
    onSave: () => {},
    onCancel: () => {}
  },
  decorators: [
    (Story) => (
      <div className="relative h-[855px] w-[1440px] bg-element-tertiary">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof BulkRenderingShotSettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {};

export const ReadOnly: Story = {
  args: { isReadOnly: true }
};
