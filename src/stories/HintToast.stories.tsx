import { HintToast } from "@components/HintToast";
import { Text } from "@components/Text";
import { Meta, StoryObj } from "@storybook/react-vite";
const noop = () => {};

const HintToastVariants = () => {
  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="grid gap-3 w-[min(640px,90vw)]">
        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Short message
          </Text>
          <HintToast message="Hold Shift to select multiple items." />
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Long message
          </Text>
          <HintToast message="You can drag and drop items between folders to reorganize your project. Hold Shift to select multiple items at once, or use Ctrl+A to select all items in the current view." />
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: "Information/HintToast",
  component: HintToast,
  parameters: {
    layout: "centered"
  },
  argTypes: {
    message: {
      control: { type: "text" }
    },
    duration: {
      control: { type: "number" }
    }
  }
} satisfies Meta<typeof HintToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  args: {
    message: ""
  },
  render: () => <HintToastVariants />
};

export const Component: Story = {
  name: "🔧 Component",
  args: {
    message: "Hold Shift to select multiple items.",
    duration: 10,
    onClose: noop
  },
  render: (args) => (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <HintToast {...args} />
    </div>
  )
};
