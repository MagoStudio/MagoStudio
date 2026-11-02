import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const meta = {
  title: "Buttons and links/IconActionButton",
  component: IconActionButton,
  parameters: {
    layout: "centered"
  },
  args: {
    icon: <Icon iconSet="16" iconName="cross" />,
    size: "xs"
  }
} satisfies Meta<typeof IconActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TransparentXS: Story = {
  name: "Transparent / XS",
  args: {
    variant: "transparent",
    size: "xs",
    icon: <Icon iconSet="16" iconName="delete" />
  }
};

export const TransparentSM: Story = {
  name: "Transparent / SM",
  args: {
    variant: "transparent",
    size: "sm",
    icon: <Icon iconSet="24" iconName="delete" />
  }
};

export const DarkXS: Story = {
  name: "Dark / XS",
  args: {
    variant: "dark",
    size: "xs",
    icon: <Icon iconSet="16" iconName="delete" />
  }
};

export const DarkSM: Story = {
  name: "Dark / SM",
  args: {
    variant: "dark",
    size: "sm",
    icon: <Icon iconSet="24" iconName="delete" />
  }
};

export const PrimaryXS: Story = {
  name: "Primary / XS",
  args: {
    variant: "primary",
    size: "xs",
    icon: <Icon iconSet="16" iconName="plus" />
  }
};

export const WhiteSM: Story = {
  name: "White / SM",
  args: {
    variant: "white",
    size: "sm",
    icon: <Icon iconSet="16" iconName="cross" />
  }
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

const headerCell =
  "px-4 py-2 text-left text-glyph-tertiary text-xs font-normal align-middle";
const cell = "px-4 py-3 align-middle";
const rowLabel =
  "px-4 py-3 text-glyph-warning text-xs font-normal whitespace-nowrap align-middle";

export const AllVariantsSM: Story = {
  name: "All Variants / SM (32px)",
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-glyph-stroke">
          <th className={headerCell} />
          <th className={headerCell}>Transparent</th>
          <th className={headerCell}>Dark</th>
          <th className={headerCell}>OnImage</th>
          <th className={headerCell}>White</th>
          <th className={headerCell}>Primary</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Normal</td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="transparent"
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="dark"
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="onImage"
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="white"
              icon={<Icon iconSet="16" iconName="cross" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="primary"
              icon={<Icon iconSet="16" iconName="cross" />}
            />
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Hover</td>
          <td className={cell}>
            <ForceHovered>
              <IconActionButton
                size="sm"
                variant="transparent"
                icon={<Icon iconSet="24" iconName="delete" />}
              />
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <IconActionButton
                size="sm"
                variant="dark"
                icon={<Icon iconSet="24" iconName="delete" />}
              />
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <IconActionButton
                size="sm"
                variant="onImage"
                icon={<Icon iconSet="24" iconName="delete" />}
              />
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <IconActionButton
                size="sm"
                variant="white"
                icon={<Icon iconSet="16" iconName="cross" />}
              />
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <IconActionButton
                size="sm"
                variant="primary"
                icon={<Icon iconSet="16" iconName="cross" />}
              />
            </ForceHovered>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Disabled</td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="transparent"
              isDisabled
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="dark"
              isDisabled
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="onImage"
              isDisabled
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="white"
              isDisabled
              icon={<Icon iconSet="16" iconName="cross" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="primary"
              isDisabled
              icon={<Icon iconSet="16" iconName="cross" />}
            />
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Loading</td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="transparent"
              loading
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="dark"
              loading
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="onImage"
              loading
              icon={<Icon iconSet="24" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="white"
              loading
              icon={<Icon iconSet="16" iconName="cross" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              size="sm"
              variant="primary"
              loading
              icon={<Icon iconSet="16" iconName="cross" />}
            />
          </td>
        </tr>
      </tbody>
    </table>
  )
};

export const AllVariantsXS: Story = {
  name: "All Variants / XS (24px)",
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-glyph-stroke">
          <th className={headerCell} />
          <th className={headerCell}>Transparent</th>
          <th className={headerCell}>Dark</th>
          <th className={headerCell}>Primary</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Normal</td>
          <td className={cell}>
            <IconActionButton
              variant="transparent"
              icon={<Icon iconSet="16" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              variant="dark"
              icon={<Icon iconSet="16" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              variant="primary"
              icon={<Icon iconSet="16" iconName="plus" />}
            />
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Hover</td>
          <td className={cell}>
            <ForceHovered>
              <IconActionButton
                variant="transparent"
                icon={<Icon iconSet="16" iconName="delete" />}
              />
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <IconActionButton
                variant="dark"
                icon={<Icon iconSet="16" iconName="delete" />}
              />
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <IconActionButton
                variant="primary"
                icon={<Icon iconSet="16" iconName="plus" />}
              />
            </ForceHovered>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Disabled</td>
          <td className={cell}>
            <IconActionButton
              variant="transparent"
              isDisabled
              icon={<Icon iconSet="16" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              variant="dark"
              isDisabled
              icon={<Icon iconSet="16" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              variant="primary"
              isDisabled
              icon={<Icon iconSet="16" iconName="plus" />}
            />
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Loading</td>
          <td className={cell}>
            <IconActionButton
              variant="transparent"
              loading
              icon={<Icon iconSet="16" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              variant="dark"
              loading
              icon={<Icon iconSet="16" iconName="delete" />}
            />
          </td>
          <td className={cell}>
            <IconActionButton
              variant="primary"
              loading
              icon={<Icon iconSet="16" iconName="plus" />}
            />
          </td>
        </tr>
      </tbody>
    </table>
  )
};
