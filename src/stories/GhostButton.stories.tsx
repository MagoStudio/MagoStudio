import { GhostButton } from "@components/GhostButton";
import { Icon } from "@components/Icon";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const meta = {
  title: "Buttons and links/GhostButton",
  component: GhostButton,
  parameters: {
    layout: "centered"
  },
  args: {
    children: "Copy"
  }
} satisfies Meta<typeof GhostButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { colorScheme: "default", children: "Copy" }
};

export const DefaultDisabled: Story = {
  name: "Default / Disabled",
  args: { colorScheme: "default", children: "Copy", isDisabled: true }
};

export const DefaultLoading: Story = {
  name: "Default / Loading",
  args: { colorScheme: "default", children: "Copy", loading: true }
};

export const DefaultWithIcon: Story = {
  name: "Default / With Icon",
  args: {
    colorScheme: "default",
    children: "Create",
    startIcon: <Icon iconSet="16" iconName="plus" />
  }
};

export const DefaultWithIconDisabled: Story = {
  name: "Default / With Icon / Disabled",
  args: {
    colorScheme: "default",
    children: "Create",
    startIcon: <Icon iconSet="16" iconName="plus" />,
    isDisabled: true
  }
};

export const DefaultWithIconLoading: Story = {
  name: "Default / With Icon / Loading",
  args: {
    colorScheme: "default",
    children: "Create",
    startIcon: <Icon iconSet="16" iconName="plus" />,
    loading: true
  }
};

export const Stroke: Story = {
  args: {
    colorScheme: "stroke",
    children: "Copy",
    startIcon: <Icon iconSet="16" iconName="download" />
  }
};

export const StrokeDisabled: Story = {
  name: "Stroke / Disabled",
  args: {
    colorScheme: "stroke",
    children: "Copy",
    startIcon: <Icon iconSet="16" iconName="download" />,
    isDisabled: true
  }
};

export const StrokeLoading: Story = {
  name: "Stroke / Loading",
  args: {
    colorScheme: "stroke",
    children: "Copy",
    startIcon: <Icon iconSet="16" iconName="download" />,
    loading: true
  }
};

export const Color: Story = {
  args: {
    colorScheme: "color",
    children: "Copy",
    startIcon: <Icon iconSet="pixels" iconName="credits" className="!size-4" />
  }
};

export const ColorDisabled: Story = {
  name: "Color / Disabled",
  args: {
    colorScheme: "color",
    children: "Copy",
    startIcon: <Icon iconSet="pixels" iconName="credits" className="!size-4" />,
    isDisabled: true
  }
};

export const White: Story = {
  args: { colorScheme: "white", children: "Copy" }
};

export const WhiteDisabled: Story = {
  name: "White / Disabled",
  args: { colorScheme: "white", children: "Use this", isDisabled: true }
};

const ForceHovered = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current
      ?.querySelector("[data-rac]")
      ?.setAttribute("data-hovered", "true");
  });
  return <div ref={ref}>{children}</div>;
};

export const Danger: Story = {
  args: { colorScheme: "danger", children: "Delete" }
};

export const DangerHover: Story = {
  name: "Danger / Hover",
  render: (args) => (
    <ForceHovered>
      <GhostButton {...args} />
    </ForceHovered>
  ),
  args: { colorScheme: "danger", children: "Delete" }
};

export const DangerDisabled: Story = {
  name: "Danger / Disabled",
  args: { colorScheme: "danger", children: "Delete", isDisabled: true }
};

export const DangerLoading: Story = {
  name: "Danger / Progress",
  args: { colorScheme: "danger", children: "Delete", loading: true }
};

export const Gradient: Story = {
  args: { colorScheme: "gradient", children: "Upgrade" }
};

export const GradientHover: Story = {
  name: "Gradient / Hover",
  render: (args) => (
    <ForceHovered>
      <GhostButton {...args} />
    </ForceHovered>
  ),
  args: { colorScheme: "gradient", children: "Upgrade" }
};

export const GradientDisabled: Story = {
  name: "Gradient / Disabled",
  args: { colorScheme: "gradient", children: "Upgrade", isDisabled: true }
};

export const GradientLoading: Story = {
  name: "Gradient / Progress",
  args: { colorScheme: "gradient", children: "Upgrade", loading: true }
};

const headerCell =
  "px-4 py-2 text-left text-glyph-tertiary text-xs font-normal align-middle";
const cell = "px-4 py-3 align-middle";
const rowLabel =
  "px-4 py-3 text-glyph-warning text-xs font-normal whitespace-nowrap align-middle";

export const AllVariants: Story = {
  name: "All Variants Overview",
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-glyph-stroke">
          <th className={headerCell} />
          <th className={headerCell}>Text</th>
          <th className={headerCell}>Icon + Text</th>
          <th className={headerCell}>Stroke</th>
          <th className={headerCell}>Color</th>
          <th className={headerCell}>White</th>
          <th className={headerCell}>Danger</th>
          <th className={headerCell}>Gradient</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Normal</td>
          <td className={cell}>
            <GhostButton>Copy</GhostButton>
          </td>
          <td className={cell}>
            <GhostButton startIcon={<Icon iconSet="16" iconName="plus" />}>
              Create
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              colorScheme="stroke"
              startIcon={<Icon iconSet="16" iconName="download" />}
            >
              Copy
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              colorScheme="color"
              startIcon={
                <Icon iconSet="pixels" iconName="credits" className="!size-4" />
              }
            >
              Copy
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton colorScheme="white">Copy</GhostButton>
          </td>
          <td className={cell}>
            <GhostButton colorScheme="danger">Delete</GhostButton>
          </td>
          <td className={cell}>
            <GhostButton colorScheme="gradient">Upgrade</GhostButton>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Medium (M)</td>
          <td className={cell}>
            <GhostButton size="md">Copy</GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              size="md"
              startIcon={<Icon iconSet="16" iconName="plus" />}
            >
              Create
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              size="md"
              colorScheme="stroke"
              startIcon={<Icon iconSet="16" iconName="download" />}
            >
              Copy
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              size="md"
              colorScheme="color"
              startIcon={
                <Icon iconSet="pixels" iconName="credits" className="!size-4" />
              }
            >
              Copy
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton size="md" colorScheme="white">
              Copy
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton size="md" colorScheme="danger">
              Delete
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton size="md" colorScheme="gradient">
              Upgrade
            </GhostButton>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Hover</td>
          <td className={cell}>
            <ForceHovered>
              <GhostButton>Copy</GhostButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <GhostButton startIcon={<Icon iconSet="16" iconName="plus" />}>
                Create
              </GhostButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <GhostButton
                colorScheme="stroke"
                startIcon={<Icon iconSet="16" iconName="download" />}
              >
                Copy
              </GhostButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <GhostButton
                colorScheme="color"
                startIcon={
                  <Icon
                    iconSet="pixels"
                    iconName="credits"
                    className="!size-4"
                  />
                }
              >
                Copy
              </GhostButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <GhostButton colorScheme="white">Copy</GhostButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <GhostButton colorScheme="danger">Delete</GhostButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <GhostButton colorScheme="gradient">Upgrade</GhostButton>
            </ForceHovered>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Loading</td>
          <td className={cell}>
            <GhostButton loading>Copy</GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              loading
              startIcon={<Icon iconSet="16" iconName="plus" />}
            >
              Create
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              colorScheme="stroke"
              loading
              startIcon={<Icon iconSet="16" iconName="download" />}
            >
              Copy
            </GhostButton>
          </td>
          <td className={cell} />
          <td className={cell} />
          <td className={cell}>
            <GhostButton colorScheme="danger" loading>
              Delete
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton colorScheme="gradient" loading>
              Upgrade
            </GhostButton>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Disabled</td>
          <td className={cell}>
            <GhostButton isDisabled>Copy</GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              isDisabled
              startIcon={<Icon iconSet="16" iconName="plus" />}
            >
              Create
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              colorScheme="stroke"
              isDisabled
              startIcon={<Icon iconSet="16" iconName="download" />}
            >
              Copy
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton
              colorScheme="color"
              isDisabled
              startIcon={
                <Icon
                  iconSet="pixels"
                  iconName="credits-locked"
                  className="!size-4"
                />
              }
            >
              Copy
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton colorScheme="white" isDisabled>
              Use this
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton colorScheme="danger" isDisabled>
              Delete
            </GhostButton>
          </td>
          <td className={cell}>
            <GhostButton colorScheme="gradient" isDisabled>
              Upgrade
            </GhostButton>
          </td>
        </tr>
      </tbody>
    </table>
  )
};
