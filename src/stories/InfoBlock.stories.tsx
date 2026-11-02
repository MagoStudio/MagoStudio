import { InfoBlock } from "@components/InfoBlock";
import { Text } from "@components/Text";
import { Meta, StoryObj } from "@storybook/react-vite";

const noop = () => {};

const InfoBlockVariants = () => {
  return (
    <div className="bg-element-tertiary p-4 min-h-screen grid gap-4 w-[min(480px,90vw)]">
      <div className="grid gap-2">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Info — One line, no icon
        </Text>
        <InfoBlock variant="info" showIcon={false}>
          If the mask looks good, go to the Apply step
        </InfoBlock>
      </div>
      <div className="grid gap-2">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Info — One line with icon
        </Text>
        <InfoBlock variant="info">
          If the mask looks good, go to the Apply step
        </InfoBlock>
      </div>
      <div className="grid gap-2">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Info — One line with close button
        </Text>
        <InfoBlock variant="info" canClose onClose={noop}>
          If the mask looks good, go to the Apply step
        </InfoBlock>
      </div>
      <div className="grid gap-2">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Info — Multi-line with close
        </Text>
        <InfoBlock variant="info" canClose onClose={noop}>
          Create a mask using a prompt or segments. Use prompts to select all
          people in a frame. To select a specific person, use Visual Selection
          or describe them precisely, for example: &quot;person on the left in a
          yellow sweater&quot;.
        </InfoBlock>
      </div>
      <div className="grid gap-2">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Warning — One line
        </Text>
        <InfoBlock variant="warning">
          Auto-prompting is not available in old projects
        </InfoBlock>
      </div>
      <div className="grid gap-2">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Warning — Multi-line with close
        </Text>
        <InfoBlock variant="warning" canClose onClose={noop}>
          Kling currently supports only 720p (1280×720) and 1080p (1920×1080)
          video
        </InfoBlock>
      </div>
    </div>
  );
};

const meta = {
  title: "Information/InfoBlock",
  component: InfoBlock,
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      options: ["info", "warning"]
    },
    showIcon: { control: { type: "boolean" } },
    canClose: { control: { type: "boolean" } }
  }
} satisfies Meta<typeof InfoBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  args: {
    variant: "info",
    children: ""
  },
  render: () => <InfoBlockVariants />
};

export const Component: Story = {
  name: "🔧 Component",
  args: {
    variant: "info",
    showIcon: true,
    canClose: true,
    onClose: noop,
    children:
      "Create a mask using a prompt or segments. Use prompts to select all people in a frame."
  },
  render: (args) => (
    <div className="bg-element-tertiary p-4 min-h-screen flex items-start justify-center">
      <div className="w-[min(480px,90vw)]">
        <InfoBlock {...args} />
      </div>
    </div>
  )
};
