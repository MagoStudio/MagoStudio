import { Icon } from "@components/Icon";
import { MainButton } from "@components/MainButton";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const meta = {
  title: "Buttons and links/MainButton",
  component: MainButton,
  parameters: {
    layout: "centered"
  },
  args: {
    children: "Button"
  }
} satisfies Meta<typeof MainButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SolidPrimary: Story = {
  name: "Solid / Primary",
  args: { variant: "solid", colorScheme: "primary", children: "Generate 0-48" }
};

export const SolidPrimaryDisabled: Story = {
  name: "Solid / Primary / Disabled",
  args: {
    variant: "solid",
    colorScheme: "primary",
    children: "Generate 0-48",
    isDisabled: true
  }
};

export const SolidPrimaryLoading: Story = {
  name: "Solid / Primary / Loading",
  args: {
    variant: "solid",
    colorScheme: "primary",
    children: "Generate 0-48",
    loading: true
  }
};

export const SolidSecondary: Story = {
  name: "Solid / Secondary",
  args: {
    variant: "solid",
    colorScheme: "secondary",
    children: "Test 1-12"
  }
};

export const SolidSecondaryDisabled: Story = {
  name: "Solid / Secondary / Disabled",
  args: {
    variant: "solid",
    colorScheme: "secondary",
    children: "Test 1-12",
    isDisabled: true
  }
};

export const SolidGradient: Story = {
  name: "Solid / Gradient",
  args: {
    variant: "solid",
    colorScheme: "gradient",
    children: "Discount"
  }
};

export const SolidDanger: Story = {
  name: "Solid / Danger",
  args: {
    colorScheme: "danger",
    children: "Cancel bulk rendering"
  }
};

export const SolidDangerDisabled: Story = {
  name: "Solid / Danger / Disabled",
  args: {
    colorScheme: "danger",
    children: "Cancel bulk rendering",
    isDisabled: true
  }
};

export const SolidDangerLoading: Story = {
  name: "Solid / Danger / Loading",
  args: {
    colorScheme: "danger",
    children: "Cancel bulk rendering",
    loading: true
  }
};

export const OutlinedDanger: Story = {
  name: "Outlined / Danger",
  args: {
    variant: "outlined",
    colorScheme: "danger",
    children: "Delete"
  }
};

export const OutlinedDangerDisabled: Story = {
  name: "Outlined / Danger / Disabled",
  args: {
    variant: "outlined",
    colorScheme: "danger",
    children: "Delete",
    isDisabled: true
  }
};

export const OutlinedOnColor: Story = {
  name: "Outlined / OnColor",
  args: {
    variant: "outlined",
    colorScheme: "onColor",
    children: "Add credits"
  }
};

export const OutlinedOnColorDisabled: Story = {
  name: "Outlined / OnColor / Disabled",
  args: {
    variant: "outlined",
    colorScheme: "onColor",
    children: "Add credits",
    isDisabled: true
  }
};

export const SmallSize: Story = {
  args: {
    variant: "solid",
    colorScheme: "primary",
    size: "sm",
    children: "Add new"
  }
};

export const WithStartIcon: Story = {
  args: {
    variant: "solid",
    colorScheme: "primary",
    children: "Create new track",
    startIcon: <Icon iconSet="16" iconName="checkmark" />
  }
};

export const WithEndIcon: Story = {
  args: {
    variant: "solid",
    colorScheme: "secondary",
    children: "Test 1-12",
    endIcon: <Icon iconSet="16" iconName="chevron-down" />
  }
};

export const FullWidth: Story = {
  args: {
    variant: "solid",
    colorScheme: "primary",
    children: "Full Width Button",
    fullWidth: true
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    )
  ]
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

const ForcePressed = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const button = ref.current?.querySelector("[data-rac]");
    button?.setAttribute("data-hovered", "true");
    button?.setAttribute("data-pressed", "true");
  });
  return <div ref={ref}>{children}</div>;
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
          <th className={headerCell}>Primary</th>
          <th className={headerCell}>Secondary</th>
          <th className={headerCell}>Gradient</th>
          <th className={headerCell}>Danger</th>
          <th className={headerCell}>OnColor</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Normal</td>
          <td className={cell}>
            <MainButton>Generate</MainButton>
          </td>
          <td className={cell}>
            <MainButton colorScheme="secondary">Test</MainButton>
          </td>
          <td className={cell}>
            <MainButton colorScheme="gradient">Discount</MainButton>
          </td>
          <td className={cell}>
            <MainButton variant="outlined" colorScheme="danger">
              Delete
            </MainButton>
          </td>
          <td className={cell}>
            <MainButton variant="outlined" colorScheme="onColor">
              Add credits
            </MainButton>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Hover</td>
          <td className={cell}>
            <ForceHovered>
              <MainButton>Generate</MainButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <MainButton colorScheme="secondary">Test</MainButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <MainButton colorScheme="gradient">Discount</MainButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <MainButton variant="outlined" colorScheme="danger">
                Delete
              </MainButton>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <MainButton variant="outlined" colorScheme="onColor">
                Add credits
              </MainButton>
            </ForceHovered>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Loading</td>
          <td className={cell}>
            <MainButton loading>Generate</MainButton>
          </td>
          <td className={cell}>
            <MainButton colorScheme="secondary" loading>
              Test
            </MainButton>
          </td>
          <td className={cell}>
            <MainButton colorScheme="gradient" loading>
              Discount
            </MainButton>
          </td>
          <td className={cell}>
            <MainButton variant="outlined" colorScheme="danger" loading>
              Delete
            </MainButton>
          </td>
          <td className={cell}>
            <MainButton variant="outlined" colorScheme="onColor" loading>
              Add credits
            </MainButton>
          </td>
        </tr>

        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Disabled</td>
          <td className={cell}>
            <MainButton isDisabled>Generate</MainButton>
          </td>
          <td className={cell}>
            <MainButton colorScheme="secondary" isDisabled>
              Test
            </MainButton>
          </td>
          <td className={cell}>
            <MainButton colorScheme="gradient" isDisabled>
              Discount
            </MainButton>
          </td>
          <td className={cell}>
            <MainButton variant="outlined" colorScheme="danger" isDisabled>
              Delete
            </MainButton>
          </td>
          <td className={cell}>
            <MainButton variant="outlined" colorScheme="onColor" isDisabled>
              Add credits
            </MainButton>
          </td>
        </tr>
      </tbody>
    </table>
  )
};

const dangerStateCell = "px-4 py-3 align-middle text-center";
const dangerStateLabel = "mt-2 text-glyph-tertiary text-xs font-normal";

export const SolidDangerStates: Story = {
  name: "Solid / Danger / State Matrix",
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-glyph-stroke">
          <th className={headerCell}>Default</th>
          <th className={headerCell}>Hover</th>
          <th className={headerCell}>Pressed</th>
          <th className={headerCell}>Progress</th>
          <th className={headerCell}>Disabled</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={dangerStateCell}>
            <MainButton colorScheme="danger">Cancel bulk rendering</MainButton>
            <div className={dangerStateLabel}>
              bg-element-error #e54545
              <br />
              text-glyph-primary-on-pic #ffffff
            </div>
          </td>
          <td className={dangerStateCell}>
            <ForceHovered>
              <MainButton colorScheme="danger">
                Cancel bulk rendering
              </MainButton>
            </ForceHovered>
            <div className={dangerStateLabel}>
              bg-glyph-error-hover #ff4d4d
              <br />
              text-glyph-primary-on-pic #ffffff
            </div>
          </td>
          <td className={dangerStateCell}>
            <ForcePressed>
              <MainButton colorScheme="danger">
                Cancel bulk rendering
              </MainButton>
            </ForcePressed>
            <div className={dangerStateLabel}>
              bg-element-error #e54545 (forced back over hover)
              <br />
              text-glyph-primary-on-pic #ffffff
            </div>
          </td>
          <td className={dangerStateCell}>
            <MainButton colorScheme="danger" loading>
              Cancel bulk rendering
            </MainButton>
            <div className={dangerStateLabel}>
              data-[loading]:bg-glyph-error-hover #ff4d4d
              <br />
              white spinner, aria-disabled (stays focusable)
            </div>
          </td>
          <td className={dangerStateCell}>
            <MainButton colorScheme="danger" isDisabled>
              Cancel bulk rendering
            </MainButton>
            <div className={dangerStateLabel}>
              bg-transparent, border-glyph-disabled #737373
              <br />
              text-glyph-disabled #737373
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  )
};

export const LoadingStatesAcrossSchemes: Story = {
  name: "Loading / All Schemes",
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-glyph-stroke">
          <th className={headerCell}>Primary</th>
          <th className={headerCell}>Secondary</th>
          <th className={headerCell}>Solid Danger</th>
          <th className={headerCell}>Outlined OnColor</th>
          <th className={headerCell}>Gradient (no DS Progress)</th>
          <th className={headerCell}>Outlined Danger (no DS entry)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={dangerStateCell}>
            <MainButton loading>Generate</MainButton>
            <div className={dangerStateLabel}>
              data-[loading]:bg-element-tertiary #303030
              <br />
              matches Main/M Disabled by coincidence
            </div>
          </td>
          <td className={dangerStateCell}>
            <MainButton colorScheme="secondary" loading>
              Test
            </MainButton>
            <div className={dangerStateLabel}>
              data-[loading]:bg-element-primary-active #262626
              <br />
              was showing #303030 (Disabled) before this fix
            </div>
          </td>
          <td className={dangerStateCell}>
            <MainButton colorScheme="danger" loading>
              Cancel bulk rendering
            </MainButton>
            <div className={dangerStateLabel}>
              data-[loading]:bg-glyph-error-hover #ff4d4d
              <br />
              this task&apos;s new variant
            </div>
          </td>
          <td className={dangerStateCell}>
            <MainButton variant="outlined" colorScheme="onColor" loading>
              Add credits
            </MainButton>
            <div className={dangerStateLabel}>
              data-[loading]:border/text-glyph-secondary #b8b8b8
              <br />
              was showing glyph-disabled before this fix
            </div>
          </td>
          <td className={dangerStateCell}>
            <MainButton colorScheme="gradient" loading>
              Discount
            </MainButton>
            <div className={dangerStateLabel}>
              no data-[loading] override — DS Discount/XS defines no Progress
              variant
              <br />
              left alone, renders its resting bg-gradient-100
            </div>
          </td>
          <td className={dangerStateCell}>
            <MainButton variant="outlined" colorScheme="danger" loading>
              Delete
            </MainButton>
            <div className={dangerStateLabel}>
              no data-[loading] override — DS has no outlined-danger entry at
              all
              <br />
              left alone, renders its resting red border/text (was showing the
              Disabled grey before this fix)
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  )
};
