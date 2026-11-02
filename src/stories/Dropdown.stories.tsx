import {
  Dropdown,
  DropdownItem,
  DropdownProps,
  DropdownType
} from "@components/Dropdown";
import { DropdownWithLabelInside } from "@components/DropdownWithLabelInside";
import { Text } from "@components/Text";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const mockItems: DropdownItem[] = [
  { key: "high", label: "High Quality" },
  { key: "balanced", label: "Balanced" },
  { key: "fast", label: "Fast Draft" },
  { key: "custom", label: "Custom" }
];

const resolutionItems: DropdownItem[] = [
  { key: "720p", label: "720p" },
  { key: "1080p", label: "1080p" },
  { key: "1440p", label: "1440p" },
  { key: "4k", label: "4K Ultra HD" }
];

const longLabelItems: DropdownItem[] = [
  {
    key: "opt-1",
    label:
      "Ultra High Definition Cinematic Render Mode with Enhanced Post-Processing"
  },
  {
    key: "opt-2",
    label: "Standard Definition Quick Preview with Watermark Overlay"
  },
  {
    key: "opt-3",
    label: "Balanced Performance Mode with Automatic Quality Scaling"
  }
];

const scrollableItems: DropdownItem[] = Array.from({ length: 15 }, (_, i) => ({
  key: `item-${i + 1}`,
  label: `Option ${i + 1}`
}));

const AllVariantsPreview = () => {
  const [selected1, setSelected1] = useState("high");
  const [selected2, setSelected2] = useState("balanced");
  const [selected3, setSelected3] = useState("1080p");
  const [selected4, setSelected4] = useState("opt-1");
  const [selected5, setSelected5] = useState("item-1");

  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="grid gap-6 w-[min(400px,90vw)]">
        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            With label inside
          </Text>
          <DropdownWithLabelInside
            items={mockItems}
            selectedKey={selected1}
            onSelectionChange={(key) => setSelected1(key as string)}
            label="Render Quality"
          />
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Without label
          </Text>
          <Dropdown
            aria-label="Render quality"
            items={mockItems}
            selectedKey={selected2}
            onSelectionChange={(key) => setSelected2(key as string)}
          />
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Resolution picker
          </Text>
          <DropdownWithLabelInside
            items={resolutionItems}
            selectedKey={selected3}
            onSelectionChange={(key) => setSelected3(key as string)}
            label="Resolution"
          />
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            With long labels
          </Text>
          <DropdownWithLabelInside
            items={longLabelItems}
            selectedKey={selected4}
            onSelectionChange={(key) => setSelected4(key as string)}
            label="Output Mode"
          />
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Scrollable (15 items)
          </Text>
          <DropdownWithLabelInside
            items={scrollableItems}
            selectedKey={selected5}
            onSelectionChange={(key) => setSelected5(key as string)}
            label="Many Options"
          />
        </div>
      </div>
    </div>
  );
};

type DropdownStoryProps = DropdownProps<DropdownItem, DropdownType>;

const InteractiveComponent = (args: DropdownStoryProps) => {
  const [selectedKey, setSelectedKey] = useState<string>("high");

  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="w-[min(400px,90vw)]">
        <Dropdown
          {...args}
          selectedKey={selectedKey}
          onSelectionChange={(key) => setSelectedKey(key as string)}
        />
      </div>
    </div>
  );
};

const meta = {
  title: "Inputs and control elements/Dropdown",
  component: Dropdown,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  args: {
    items: mockItems
  },
  render: () => <AllVariantsPreview />
};

export const Component: Story = {
  name: "🔧 Component",
  args: {
    items: mockItems
  },
  render: (args) => <InteractiveComponent {...args} />
};

const taskItems: DropdownItem[] = [
  { key: "none", label: "Multipurpose" },
  { key: "vfx_edit", label: "VFX edit" },
  { key: "head_swap", label: "Head swap" },
  { key: "character_swap", label: "Character swap" },
  { key: "style_transfer", label: "Style transfer" },
  { key: "crossview", label: "New camera angle" }
];

export const PopoverSizedToContent: Story = {
  name: "Popover sized to content",
  args: {
    items: taskItems
  },
  render: (args) => (
    <div className="flex gap-6 bg-element-tertiary p-4 min-h-screen">
      <div className="grid gap-2 w-[130px] content-start">
        <Text component="div" variant="xs" color="glyph-tertiary">
          Trigger width (default)
        </Text>
        <Dropdown
          {...args}
          aria-label="Task, trigger width"
          defaultValue="none"
          defaultOpen
        />
      </div>
      <div className="grid gap-2 w-[130px] ml-[120px] content-start">
        <Text component="div" variant="xs" color="glyph-tertiary">
          Content width
        </Text>
        <Dropdown
          {...args}
          aria-label="Task, content width"
          defaultValue="none"
          popoverWidth="content"
        />
      </div>
    </div>
  )
};
