import { Text } from "@components/Text";
import {
  TwoLevelsDropdown,
  TwoLevelsDropdownCategory
} from "@components/TwoLevelsDropdown";
import { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const mockCategories: TwoLevelsDropdownCategory[] = [
  {
    key: "generation",
    label: "Generation",
    items: [
      {
        key: "model-a",
        label: "Model Alpha",
        description: "High quality generation with fine details"
      },
      {
        key: "model-b",
        label: "Model Beta",
        description: "Fast generation optimized for speed"
      },
      {
        key: "model-c",
        label: "Model Gamma",
        description: "Balanced quality and performance"
      }
    ]
  },
  {
    key: "stylization",
    label: "Stylization",
    items: [
      {
        key: "style-1",
        label: "Artistic Style",
        description: "Applies artistic filters and effects"
      },
      {
        key: "style-2",
        label: "Realistic Style",
        description: "Photo-realistic rendering output"
      }
    ]
  },
  {
    key: "experimental",
    label: "Experimental",
    items: [
      {
        key: "exp-1",
        label: "Prototype X",
        description: "Cutting-edge experimental model"
      }
    ]
  }
];

const manyItemsCategories: TwoLevelsDropdownCategory[] = [
  {
    key: "popular",
    label: "Popular",
    items: Array.from({ length: 12 }, (_, i) => ({
      key: `popular-${i + 1}`,
      label: `Popular Model ${i + 1}`,
      description: `Description for popular model ${i + 1}`
    }))
  },
  {
    key: "recent",
    label: "Recent",
    items: Array.from({ length: 8 }, (_, i) => ({
      key: `recent-${i + 1}`,
      label: `Recent Model ${i + 1}`,
      description: `Description for recent model ${i + 1}`
    }))
  }
];

const AllVariantsPreview = () => {
  const [selectedKey, setSelectedKey] = useState("model-a");
  const [manyItemsKey, setManyItemsKey] = useState("popular-1");

  const selectedItem = mockCategories
    .flatMap((c) => c.items)
    .find((i) => i.key === selectedKey);

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
            Default (3 categories)
          </Text>
          <TwoLevelsDropdown
            selectedKey={selectedKey}
            selectedLabel={selectedItem?.label ?? ""}
            categories={mockCategories}
            onSelectionChange={setSelectedKey}
            ariaLabel="Model selection"
          />
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Single category
          </Text>
          <TwoLevelsDropdown
            selectedKey="style-1"
            selectedLabel="Artistic Style"
            categories={[mockCategories[1]]}
            onSelectionChange={() => {}}
            ariaLabel="Style selection"
          />
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Items without descriptions
          </Text>
          <TwoLevelsDropdown
            selectedKey="item-1"
            selectedLabel="Option One"
            categories={[
              {
                key: "basic",
                label: "Basic",
                items: [
                  { key: "item-1", label: "Option One" },
                  { key: "item-2", label: "Option Two" },
                  { key: "item-3", label: "Option Three" }
                ]
              }
            ]}
            onSelectionChange={() => {}}
            ariaLabel="Basic selection"
          />
        </div>

        <div className="grid gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Many items (scrollable submenu)
          </Text>
          <TwoLevelsDropdown
            selectedKey={manyItemsKey}
            selectedLabel={
              manyItemsCategories
                .flatMap((c) => c.items)
                .find((i) => i.key === manyItemsKey)?.label ?? ""
            }
            categories={manyItemsCategories}
            onSelectionChange={setManyItemsKey}
            ariaLabel="Many items selection"
          />
        </div>
      </div>
    </div>
  );
};

type TwoLevelsDropdownProps = React.ComponentProps<typeof TwoLevelsDropdown>;

const InteractiveComponent = (args: TwoLevelsDropdownProps) => {
  const [selectedKey, setSelectedKey] = useState(args.selectedKey);

  const selectedItem = args.categories
    .flatMap((c) => c.items)
    .find((i) => i.key === selectedKey);

  return (
    <div className="bg-element-tertiary p-4 min-h-screen">
      <div className="w-[min(400px,90vw)]">
        <TwoLevelsDropdown
          {...args}
          selectedKey={selectedKey}
          selectedLabel={selectedItem?.label ?? args.selectedLabel}
          onSelectionChange={(key) => {
            setSelectedKey(key);
            args.onSelectionChange(key);
          }}
        />
      </div>
    </div>
  );
};

const meta = {
  title: "Inputs and control elements/TwoLevelsDropdown",
  component: TwoLevelsDropdown,
  parameters: {
    layout: "fullscreen"
  },
  argTypes: {
    selectedKey: {
      control: { type: "text" }
    },
    ariaLabel: {
      control: { type: "text" }
    }
  }
} satisfies Meta<typeof TwoLevelsDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  args: {
    selectedKey: "model-a",
    selectedLabel: "Model Alpha",
    categories: mockCategories,
    onSelectionChange: () => {},
    ariaLabel: "Model selection"
  },
  render: () => <AllVariantsPreview />
};

export const Component: Story = {
  name: "🔧 Component",
  args: {
    selectedKey: "model-a",
    selectedLabel: "Model Alpha",
    categories: mockCategories,
    onSelectionChange: () => {},
    ariaLabel: "Model selection"
  },
  render: (args) => <InteractiveComponent {...args} />
};
