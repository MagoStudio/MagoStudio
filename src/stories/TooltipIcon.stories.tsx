import { TooltipIcon } from "@components/TooltipIcon";
import { useTooltip } from "@hooks/useTooltip";
import { Meta, StoryObj } from "@storybook/react-vite";

const TooltipIconPreview = () => {
  const { visible, showTooltip, hideTooltip } = useTooltip();

  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div
        className="min-h-[180px] flex items-center justify-center"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        <TooltipIcon isVisible={visible} icon="info" iconColor="glyph-tertiary">
          TooltipIcon content
        </TooltipIcon>
      </div>
    </div>
  );
};

const meta = {
  title: "Information/TooltipIcon",
  component: TooltipIconPreview,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof TooltipIconPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Component: Story = {
  name: "🔧 Component",
  render: () => <TooltipIconPreview />
};
