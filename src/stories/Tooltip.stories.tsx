import { Tooltip } from "@components/Tooltip";
import { Meta, StoryObj } from "@storybook/react-vite";

const TooltipPreview = () => {
  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="min-h-[180px] flex items-center justify-center">
        <Tooltip placement="top" textContent="Tooltip content">
          <button
            type="button"
            className="rounded border border-glyph-tertiary px-3 py-2 text-sm text-glyph-primary"
          >
            Tooltip trigger
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

const meta = {
  title: "Information/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Component: Story = {
  name: "🔧 Component",
  render: () => <TooltipPreview />
};
