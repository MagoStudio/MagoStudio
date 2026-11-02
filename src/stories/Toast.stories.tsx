import { Text } from "@components/Text";
import { Toast } from "@components/Toast";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useTranslation } from "react-i18next";

const noop = () => {};

const ToastVariants = () => {
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
            Simple text toast (with timer)
          </Text>
          <Toast showTimer autoDismiss duration={4}>
            Your changes were saved successfully.
          </Toast>
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Toast with submit + cancel buttons
          </Text>
          <Toast
            showTimer
            autoDismiss
            duration={4}
            onSubmitText="Confirm"
            onSubmit={noop}
            onCancelText="Cancel"
            onCancel={noop}
          >
            Are you sure you want to delete this item?
          </Toast>
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Toast with inverted button colors
          </Text>
          <Toast
            showTimer
            autoDismiss
            duration={4}
            onSubmitText="Delete"
            onSubmit={noop}
            onCancelText="Keep"
            onCancel={noop}
            invertedSubmitAndCancelColors
          >
            This action cannot be undone.
          </Toast>
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Toast without timer (no auto-dismiss)
          </Text>
          <Toast showTimer={false} autoDismiss={false}>
            This toast stays until dismissed manually.
          </Toast>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: "Information/Toast",
  component: Toast,
  parameters: {
    layout: "centered"
  },
  argTypes: {
    showTimer: {
      control: { type: "boolean" }
    },
    autoDismiss: {
      control: { type: "boolean" }
    },
    duration: {
      control: { type: "number" }
    },
    invertedSubmitAndCancelColors: {
      control: { type: "boolean" }
    },
    onSubmitText: {
      control: { type: "text" }
    },
    onCancelText: {
      control: { type: "text" }
    }
  }
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  args: {
    children: ""
  },
  render: () => <ToastVariants />
};

export const Component: Story = {
  name: "🔧 Component",
  args: {
    children: "Your changes were saved successfully.",
    showTimer: true,
    autoDismiss: true,
    duration: 4,
    invertedSubmitAndCancelColors: false,
    onSubmitText: "Confirm",
    onSubmit: noop,
    onCancelText: "Cancel",
    onCancel: noop
  },
  render: (args) => (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <Toast {...args} />
    </div>
  )
};

const LongMessageWrapping = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="grid gap-3 w-[min(320px,90vw)]">
        <Text
          component="div"
          variant="xs"
          color="glyph-secondary"
          weight="medium"
        >
          Long message wraps at word boundaries, not mid-character
        </Text>
        <Toast showTimer={false} autoDismiss={false}>
          {t("longForm.downloadEdit.notJoinable.label")}
        </Toast>
      </div>
    </div>
  );
};

export const LongMessage: Story = {
  name: "Long message wrapping",
  args: {
    children: ""
  },
  render: () => <LongMessageWrapping />
};
