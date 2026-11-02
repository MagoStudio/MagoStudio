import { Popover } from "@components/Popover";
import { Text } from "@components/Text";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";

type PopoverProps = React.ComponentProps<typeof Popover>;

type Placement = NonNullable<PopoverProps["placement"]>;

const PlacementPreview: React.FC<{
  label: string;
  placement: Placement;
  content: string;
}> = ({ label, placement, content }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="grid gap-2">
      <Text
        component="div"
        variant="xs"
        color="glyph-secondary"
        weight="medium"
      >
        {label}
      </Text>
      <div className="min-h-[120px] flex items-center justify-center">
        <button
          ref={triggerRef}
          type="button"
          className="rounded border border-glyph-tertiary px-3 py-2 text-sm text-glyph-primary"
        >
          Trigger
        </button>
        <Popover
          triggerRef={triggerRef}
          isOpen
          placement={placement}
          offset={10}
        >
          {content}
        </Popover>
      </div>
    </div>
  );
};

const PopoverPlacements = () => {
  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="grid gap-3 grid-cols-2 w-[min(640px,90vw)]">
        <PlacementPreview
          label="Top"
          placement="top"
          content="Popover on top."
        />
        <PlacementPreview
          label="Bottom"
          placement="bottom"
          content="Popover on bottom."
        />
        <PlacementPreview
          label="Left"
          placement="left"
          content="Popover on left."
        />
        <PlacementPreview
          label="Right"
          placement="right"
          content="Popover on right."
        />
      </div>
    </div>
  );
};

const PopoverComponent = (args: PopoverProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(Boolean(args.isOpen));
  const [lastArgsIsOpen, setLastArgsIsOpen] = useState(args.isOpen);

  if (args.isOpen !== lastArgsIsOpen) {
    setLastArgsIsOpen(args.isOpen);
    setIsOpen(Boolean(args.isOpen));
  }

  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="min-h-[180px] flex items-center justify-center">
        <button
          ref={triggerRef}
          type="button"
          className="rounded border border-glyph-tertiary px-3 py-2 text-sm text-glyph-primary"
          onClick={() => setIsOpen((previousState) => !previousState)}
        >
          Trigger
        </button>
        <Popover
          {...args}
          triggerRef={triggerRef}
          isOpen={isOpen}
          onOpenChange={(nextIsOpen) => {
            setIsOpen(nextIsOpen);
            args.onOpenChange?.(nextIsOpen);
          }}
        >
          {args.children}
        </Popover>
      </div>
    </div>
  );
};

const meta = {
  title: "Information/Popover",
  component: Popover,
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    placement: {
      control: { type: "inline-radio" },
      options: ["top", "bottom", "left", "right", "start", "end"]
    },
    offset: {
      control: { type: "number" }
    },
    isOpen: {
      control: { type: "boolean" }
    }
  }
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placements: Story = {
  args: {
    children: "Popover content",
    isOpen: true
  },
  render: () => <PopoverPlacements />
};

export const Component: Story = {
  name: "🔧 Component",
  args: {
    placement: "top",
    offset: 10,
    isOpen: false,
    children: "Popover content"
  },
  render: (args) => <PopoverComponent {...args} />
};
