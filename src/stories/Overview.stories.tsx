import { HintToast } from "@components/HintToast";
import { Message } from "@components/Message";
import { Popover } from "@components/Popover";
import { Text } from "@components/Text";
import { Toast } from "@components/Toast";
import { Tooltip } from "@components/Tooltip";
import { TooltipIcon } from "@components/TooltipIcon";
import { useTooltip } from "@hooks/useTooltip";
import { Meta, StoryObj } from "@storybook/react-vite";
import { cn } from "@utils";
import { useRef } from "react";

type BackgroundPreset = "home" | "project" | "pricing";

type OverviewPanelProps = {
  backgroundPreset: BackgroundPreset;
};

const backgroundPresetClasses: Record<BackgroundPreset, string> = {
  home: "bg-home-gradient",
  project: "bg-surface-secondary",
  pricing:
    "bg-[url('/assets/images/background/pricing-pattern.svg')] bg-no-repeat bg-fixed bg-position-[center_45px]"
};

const PopoverOverviewArticle = () => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <article className="border border-glyph-tertiary rounded-[10px] p-3">
      <Text component="div" variant="sm" weight="semibold" className="mb-3">
        Popover
      </Text>
      <div className="min-h-[92px] flex items-center justify-center">
        <button
          ref={triggerRef}
          type="button"
          className="rounded border border-glyph-tertiary px-3 py-2 text-sm text-glyph-primary"
        >
          Trigger
        </button>
        <Popover triggerRef={triggerRef} isOpen placement="top" offset={10}>
          General information.
        </Popover>
      </div>
    </article>
  );
};

const TooltipOverviewArticle = () => {
  const { visible, showTooltip, hideTooltip } = useTooltip();

  return (
    <article className="border border-glyph-tertiary rounded-[10px] p-3">
      <Text component="div" variant="sm" weight="semibold" className="mb-3">
        Tooltip
      </Text>
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Tooltip
          </Text>
          <div className="min-h-[92px] flex items-center justify-center">
            <Tooltip placement="top" textContent="General information.">
              <button
                type="button"
                className="rounded border border-glyph-tertiary px-3 py-2 text-sm text-glyph-primary"
              >
                Trigger
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            TooltipIcon
          </Text>
          <div
            className="min-h-[92px] flex items-center justify-center"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            <TooltipIcon
              isVisible={visible}
              icon="info"
              iconColor="glyph-tertiary"
            >
              General information.
            </TooltipIcon>
          </div>
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            TextWithTooltip
          </Text>
          <div
            className="min-h-[92px] flex items-center justify-center gap-2"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            <Text color="glyph-primary">Example text</Text>
            <TooltipIcon
              icon="help"
              iconColor="glyph-tertiary"
              iconSize="sm"
              isVisible={visible}
            >
              General information.
            </TooltipIcon>
          </div>
        </div>
      </div>
    </article>
  );
};

const OverviewPanel = ({ backgroundPreset }: OverviewPanelProps) => {
  return (
    <section
      className={cn(
        "p-5 min-h-[320px] h-screen",
        backgroundPresetClasses[backgroundPreset]
      )}
    >
      <div className="grid gap-4">
        <article className="border border-glyph-tertiary rounded-[10px] p-3">
          <Text component="div" variant="sm" weight="semibold" className="mb-3">
            Message
          </Text>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Text
                component="div"
                variant="xs"
                color="glyph-secondary"
                weight="medium"
              >
                Success
              </Text>
              <Message variant="success">Saved successfully</Message>
            </div>

            <div className="grid gap-2">
              <Text
                component="div"
                variant="xs"
                color="glyph-secondary"
                weight="medium"
              >
                Warning
              </Text>
              <Message variant="warning">Please review this step</Message>
            </div>

            <div className="grid gap-2">
              <Text
                component="div"
                variant="xs"
                color="glyph-secondary"
                weight="medium"
              >
                Error
              </Text>
              <Message variant="error">Something went wrong</Message>
            </div>
          </div>
        </article>

        <PopoverOverviewArticle />
        <TooltipOverviewArticle />

        <article className="border border-glyph-tertiary rounded-[10px] p-3">
          <Text component="div" variant="sm" weight="semibold" className="mb-3">
            Toast
          </Text>
          <div className="grid gap-3">
            <Toast showTimer autoDismiss={false}>
              Your changes were saved successfully.
            </Toast>
            <Toast
              showTimer
              autoDismiss={false}
              onSubmitText="Confirm"
              onSubmit={() => {}}
              onCancelText="Cancel"
              onCancel={() => {}}
            >
              Are you sure you want to delete this item?
            </Toast>
          </div>
        </article>

        <article className="border border-glyph-tertiary rounded-[10px] p-3">
          <Text component="div" variant="sm" weight="semibold" className="mb-3">
            HintToast
          </Text>
          <HintToast message="Hold Shift to select multiple items." />
        </article>
      </div>
    </section>
  );
};

const meta = {
  title: "Overview/Gallery",
  component: OverviewPanel,
  argTypes: {
    backgroundPreset: {
      control: { type: "select" },
      options: ["home", "project", "pricing"]
    }
  }
} satisfies Meta<typeof OverviewPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  args: {
    backgroundPreset: "home"
  }
};
