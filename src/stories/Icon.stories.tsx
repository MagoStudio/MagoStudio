import { Icon } from "@components/Icon";
import { iconRegistry, type IconSet } from "@components/Icon/iconRegistry";
import { Text } from "@components/Text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const ICON_SET_LABELS: Record<IconSet, string> = {
  "16": "16px Regular",
  "16-filled": "16px Filled",
  "16-technical": "16px Technical",
  "24": "24px Regular",
  "24-filled": "24px Filled",
  bold: "Bold",
  decorators: "Decorators",
  loading: "Loading",
  pixels: "Pixels"
};

const NON_EMPTY_ICON_SETS = (Object.keys(iconRegistry) as IconSet[]).filter(
  (set) => Object.keys(iconRegistry[set]).length > 0
);

function IconCard({
  iconSet,
  iconName
}: {
  iconSet: IconSet;
  iconName: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-glyph-stroke p-3">
      <div className="flex h-10 w-10 items-center justify-center">
        <Icon
          iconSet={iconSet}
          iconName={iconName as never}
          className="text-white"
        />
      </div>
      <span className="text-xs text-white">{iconName}</span>
    </div>
  );
}

function IconSetSection({ iconSet }: { iconSet: IconSet }) {
  const iconNames = Object.keys(iconRegistry[iconSet]);
  if (iconNames.length === 0) return null;

  return (
    <div className="grid gap-3">
      <Text
        component="div"
        variant="sm"
        weight="semibold"
        color="glyph-primary"
      >
        {ICON_SET_LABELS[iconSet]} ({iconNames.length})
      </Text>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] items-start gap-2">
        {iconNames.map((name) => (
          <IconCard
            key={`${iconSet}-${name}`}
            iconSet={iconSet}
            iconName={name}
          />
        ))}
      </div>
    </div>
  );
}

function AllIconsGallery() {
  return (
    <div className="h-screen overflow-y-auto grid content-start gap-8 p-6 bg-element-tertiary">
      {NON_EMPTY_ICON_SETS.map((iconSet) => (
        <IconSetSection key={iconSet} iconSet={iconSet} />
      ))}
    </div>
  );
}

function SingleSetGallery({ iconSet }: { iconSet: IconSet }) {
  const iconNames = Object.keys(iconRegistry[iconSet]);

  return (
    <div className="h-screen overflow-y-auto grid content-start gap-3 p-6 bg-element-tertiary">
      <Text
        component="div"
        variant="sm"
        weight="semibold"
        color="glyph-primary"
      >
        {ICON_SET_LABELS[iconSet]} ({iconNames.length})
      </Text>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] items-start gap-2">
        {iconNames.map((name) => (
          <IconCard key={name} iconSet={iconSet} iconName={name} />
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "Icons/Icon",
  component: Icon,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  args: { iconSet: "16", iconName: "plus" as never },
  render: () => <AllIconsGallery />
};

export const Regular16: Story = {
  name: "16px Regular",
  args: { iconSet: "16", iconName: "plus" as never },
  render: () => <SingleSetGallery iconSet="16" />
};

export const Filled16: Story = {
  name: "16px Filled",
  args: { iconSet: "16", iconName: "plus" as never },
  render: () => <SingleSetGallery iconSet="16-filled" />
};

export const Technical16: Story = {
  name: "16px Technical",
  args: { iconSet: "16", iconName: "plus" as never },
  render: () => <SingleSetGallery iconSet="16-technical" />
};

export const Regular24: Story = {
  name: "24px Regular",
  args: { iconSet: "16", iconName: "plus" as never },
  render: () => <SingleSetGallery iconSet="24" />
};

export const Filled24: Story = {
  name: "24px Filled",
  args: { iconSet: "16", iconName: "plus" as never },
  render: () => <SingleSetGallery iconSet="24-filled" />
};

export const Pixels: Story = {
  args: { iconSet: "16", iconName: "plus" as never },
  render: () => <SingleSetGallery iconSet="pixels" />
};

function InteractiveIcon() {
  const [iconSet, setIconSet] = React.useState<IconSet>("24");
  const iconNames = Object.keys(iconRegistry[iconSet]);
  const [iconName, setIconName] = React.useState(iconNames[0] ?? "");

  const handleSetChange = (newSet: IconSet) => {
    setIconSet(newSet);
    const names = Object.keys(iconRegistry[newSet]);
    setIconName(names[0] ?? "");
  };

  return (
    <div className="flex h-screen flex-col items-center gap-6 p-12 bg-element-tertiary">
      <div className="flex gap-4">
        <select
          value={iconSet}
          onChange={(e) => handleSetChange(e.target.value as IconSet)}
          className="rounded bg-neutral-700 px-3 py-1.5 text-sm text-white"
        >
          {NON_EMPTY_ICON_SETS.map((set) => (
            <option key={set} value={set}>
              {ICON_SET_LABELS[set]}
            </option>
          ))}
        </select>
        <select
          value={iconName}
          onChange={(e) => setIconName(e.target.value)}
          className="rounded bg-neutral-700 px-3 py-1.5 text-sm text-white"
        >
          {iconNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-glyph-stroke">
        <Icon
          iconSet={iconSet}
          iconName={iconName as never}
          className="text-white"
        />
      </div>
      <span className="text-sm text-white">
        {ICON_SET_LABELS[iconSet]} / {iconName}
      </span>
    </div>
  );
}

export const Component: Story = {
  name: "\uD83D\uDD27 Component",
  args: { iconSet: "24", iconName: "plus" as never },
  render: () => <InteractiveIcon />
};
