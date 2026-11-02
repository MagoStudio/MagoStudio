import { Checkbox } from "@components/Checkbox";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const meta = {
  title: "Inputs/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

const headerCell =
  "px-4 py-2 text-left text-glyph-tertiary text-xs font-normal align-middle";
const cell = "px-4 py-3 align-middle";

const ForcedAncestorHover = ({ children }: { children: React.ReactNode }) => (
  <div className="group" data-hovered="true">
    {children}
  </div>
);

const ForcedAncestorPressed = ({ children }: { children: React.ReactNode }) => (
  <div className="group" data-pressed="true">
    {children}
  </div>
);

export const AllStates: Story = {
  name: "All Design System States",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="overflow-x-auto bg-surface-secondary p-6">
      <table className="border-collapse">
        <thead>
          <tr className="border-b border-glyph-stroke">
            <th className={headerCell}>Unselected</th>
            <th className={headerCell}>Hover</th>
            <th className={headerCell}>Pressed</th>
            <th className={headerCell}>Selected</th>
            <th className={headerCell}>Selected Hover</th>
            <th className={headerCell}>Disabled Unselected</th>
            <th className={headerCell}>Disabled Selected</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={cell}>
              <Checkbox isChecked={false} />
            </td>
            <td className={cell}>
              <ForcedAncestorHover>
                <Checkbox isChecked={false} isPresentational />
              </ForcedAncestorHover>
            </td>
            <td className={cell}>
              <ForcedAncestorPressed>
                <Checkbox isChecked={false} isPresentational />
              </ForcedAncestorPressed>
            </td>
            <td className={cell}>
              <Checkbox isChecked />
            </td>
            <td className={cell}>
              <ForcedAncestorHover>
                <Checkbox isChecked isPresentational />
              </ForcedAncestorHover>
            </td>
            <td className={cell}>
              <Checkbox isChecked={false} disabled />
            </td>
            <td className={cell}>
              <Checkbox isChecked disabled />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
};

export const WithLabel: Story = {
  name: "With label",
  args: { isChecked: true, label: "Stylize the video" }
};

export const PresentationalInsideACard: Story = {
  name: "Presentational (nested inside a clickable card)",
  render: () => (
    <div className="group flex size-[134px] items-start rounded bg-element-primary p-3">
      <Checkbox isChecked isPresentational />
    </div>
  )
};

export const PresentationalOverThumbnail: Story = {
  name: "Presentational, transparent over a thumbnail (hover)",
  render: () => (
    <div className="flex size-[134px] items-start rounded bg-element-secondary p-3">
      <ForcedAncestorHover>
        <Checkbox
          isChecked={false}
          isPresentational
          hoverFillsBackground={false}
        />
      </ForcedAncestorHover>
    </div>
  )
};
