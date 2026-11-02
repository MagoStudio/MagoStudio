import { PinRenderButton } from "@home/project-timeline/components/PinRenderButton";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import React from "react";

const noop = () => {};

const meta = {
  title: "Timeline/PinRenderButton",
  component: PinRenderButton,
  parameters: {
    layout: "centered"
  },
  args: { onPress: noop }
} satisfies Meta<typeof PinRenderButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const Sized = ({
  width,
  children
}: {
  width: number;
  children: React.ReactNode;
}) => (
  <div className="flex h-[76px] bg-element-primary p-0.5" style={{ width }}>
    {children}
  </div>
);

const ForceHovered = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current
      ?.querySelector("[data-rac]")
      ?.setAttribute("data-hovered", "true");
  });
  return <div ref={ref}>{children}</div>;
};

export const Default: Story = {
  render: (args) => (
    <Sized width={300}>
      <PinRenderButton {...args} />
    </Sized>
  )
};

export const Hover: Story = {
  render: (args) => (
    <ForceHovered>
      <Sized width={300}>
        <PinRenderButton {...args} />
      </Sized>
    </ForceHovered>
  )
};

const headerCell =
  "px-4 py-2 text-left text-glyph-tertiary text-xs font-normal align-middle";
const cell = "px-4 py-3 align-top";
const rowLabel =
  "px-4 py-3 text-glyph-warning text-xs font-normal whitespace-nowrap align-middle";

export const AllStates: Story = {
  name: "All States Overview",
  render: (args) => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-glyph-stroke">
          <th className={headerCell} />
          <th className={headerCell}>{"< 40px (empty)"}</th>
          <th className={headerCell}>{"< 124px (icon only)"}</th>
          <th className={headerCell}>{"≥ 124px (icon + text)"}</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Rest</td>
          <td className={cell}>
            <Sized width={32}>
              <PinRenderButton {...args} />
            </Sized>
          </td>
          <td className={cell}>
            <Sized width={80}>
              <PinRenderButton {...args} />
            </Sized>
          </td>
          <td className={cell}>
            <Sized width={200}>
              <PinRenderButton {...args} />
            </Sized>
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Hover</td>
          <td className={cell}>
            <ForceHovered>
              <Sized width={32}>
                <PinRenderButton {...args} />
              </Sized>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <Sized width={80}>
                <PinRenderButton {...args} />
              </Sized>
            </ForceHovered>
          </td>
          <td className={cell}>
            <ForceHovered>
              <Sized width={200}>
                <PinRenderButton {...args} />
              </Sized>
            </ForceHovered>
          </td>
        </tr>
      </tbody>
    </table>
  )
};
