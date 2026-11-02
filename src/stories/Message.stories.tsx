import { Message } from "@components/Message";
import { Text } from "@components/Text";
import { Meta, StoryObj } from "@storybook/react-vite";

const MessageVariants = () => {
  return (
    <div className="bg-element-tertiary p-4 min-h-screen flex flex-col gap-3 w-[min(640px,90vw)]">
      <div className="flex flex-col gap-2 items-start">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Success
        </Text>
        <Message variant="success" duration={4000}>
          Your changes were saved successfully.
        </Message>
      </div>

      <div className="flex flex-col gap-2 items-start">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Warning
        </Text>
        <Message variant="warning" duration={4000}>
          Your session is about to expire.
        </Message>
      </div>

      <div className="flex flex-col gap-2 items-start">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Error
        </Text>
        <Message variant="error" duration={4000}>
          Something went wrong. Please try again.
        </Message>
      </div>
    </div>
  );
};

const meta = {
  title: "Information/Message",
  component: Message,
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    variant: {
      control: { type: "inline-radio" },
      options: ["success", "warning", "error"]
    },
    placement: {
      control: { type: "inline-radio" },
      options: ["top", "bottom"]
    },
    duration: {
      control: { type: "number" }
    },
    offset: {
      control: { type: "number" }
    }
  }
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  args: {
    variant: "success",
    children: ""
  },
  render: () => <MessageVariants />
};

export const Component: Story = {
  name: "🔧 Component",
  args: {
    variant: "success",
    children: "Your changes were saved successfully.",
    duration: 4000,
    placement: "top",
    offset: 8
  },
  render: (args) => (
    <div className="bg-element-tertiary p-4 min-h-screen flex items-center justify-center">
      <Message {...args} />
    </div>
  )
};
