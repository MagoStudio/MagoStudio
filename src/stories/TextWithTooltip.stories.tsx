import { Text } from "@components/Text";
import { TooltipIcon } from "@components/TooltipIcon";
import { useTooltip } from "@hooks/useTooltip";
import { Meta, StoryObj } from "@storybook/react-vite";
import { cn } from "@utils";

const TextWithTooltipPreview = () => {
  const { visible, showTooltip, hideTooltip } = useTooltip();

  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="min-h-[180px] flex items-center justify-center">
        <div
          className={cn("flex justify-center gap-2")}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          <Text color="glyph-primary" overflow="hidden" textOverflow="ellipsis">
            TextWithTooltip text
          </Text>
          <TooltipIcon
            icon="help"
            iconSet="16"
            iconColor="glyph-tertiary"
            iconSize="sm"
            isVisible={visible}
          >
            TextWithTooltip tooltip content
          </TooltipIcon>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: "Information/TextWithTooltip",
  component: TextWithTooltipPreview,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof TextWithTooltipPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Component: Story = {
  name: "🔧 Component"
};
