import { BulkRenderingShotSettingsRow } from "@components/BulkRenderingShotSettingsRow";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

const ForceHovered = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  // oxlint-disable-next-line custom-react/no-use-effect -- must re-run on every render to keep the story's forced data-hovered attribute set; useMountEffect would only apply it once
  React.useEffect(() => {
    ref.current
      ?.querySelector("[data-rac]")
      ?.setAttribute("data-hovered", "true");
  });
  return <div ref={ref}>{children}</div>;
};

const ForcePressed = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  // oxlint-disable-next-line custom-react/no-use-effect -- must re-run on every render to keep the story's forced data-pressed attribute set; useMountEffect would only apply it once
  React.useEffect(() => {
    ref.current
      ?.querySelector("[data-rac]")
      ?.setAttribute("data-pressed", "true");
  });
  return <div ref={ref}>{children}</div>;
};

const headerCell =
  "px-4 py-2 text-left text-glyph-tertiary text-xs font-normal align-middle";
const cell = "px-4 py-3 align-middle";
const rowLabel =
  "px-4 py-3 text-glyph-warning text-xs font-normal whitespace-nowrap align-middle";

const meta = {
  title: "Cards/BulkRenderingShotSettingsRow",
  component: BulkRenderingShotSettingsRow,
  parameters: {
    layout: "centered"
  },
  args: {
    label: "Render engine",
    value: "Seedance 2",
    icon: "edit",
    ariaLabel: "Open settings"
  }
} satisfies Meta<typeof BulkRenderingShotSettingsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Hover: Story = {
  render: (args) => (
    <ForceHovered>
      <BulkRenderingShotSettingsRow {...args} />
    </ForceHovered>
  )
};

export const Active: Story = {
  render: (args) => (
    <ForcePressed>
      <BulkRenderingShotSettingsRow {...args} />
    </ForcePressed>
  )
};

export const Selected: Story = {
  args: { isPanelOpen: true }
};

export const Disabled: Story = {
  args: { isDisabled: true }
};

export const Overridden: Story = {
  name: "Unique settings (edited)",
  args: { value: "Unique settings", isOverridden: true }
};

export const Error: Story = {
  args: { value: "Unique settings", hasError: true }
};

export const AllStates: Story = {
  name: "All States Overview",
  render: () => (
    <table className="border-collapse">
      <thead>
        <tr className="border-b border-glyph-stroke">
          <th className={headerCell} />
          <th className={headerCell}>Row</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Normal</td>
          <td className={cell}>
            <BulkRenderingShotSettingsRow
              label="Render engine"
              value="Seedance 2"
              icon="edit"
              ariaLabel="Open settings"
            />
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Hover</td>
          <td className={cell}>
            <ForceHovered>
              <BulkRenderingShotSettingsRow
                label="Render engine"
                value="Seedance 2"
                icon="edit"
                ariaLabel="Open settings"
              />
            </ForceHovered>
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Active</td>
          <td className={cell}>
            <ForcePressed>
              <BulkRenderingShotSettingsRow
                label="Render engine"
                value="Seedance 2"
                icon="edit"
                ariaLabel="Open settings"
              />
            </ForcePressed>
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Selected (panel open)</td>
          <td className={cell}>
            <BulkRenderingShotSettingsRow
              label="Render engine"
              value="Seedance 2"
              icon="edit"
              ariaLabel="Open settings"
              isPanelOpen
            />
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Disabled</td>
          <td className={cell}>
            <BulkRenderingShotSettingsRow
              label="Render engine"
              value="Seedance 2"
              icon="edit"
              ariaLabel="Open settings"
              isDisabled
            />
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Unique settings (edited)</td>
          <td className={cell}>
            <BulkRenderingShotSettingsRow
              label="Render engine"
              value="Unique settings"
              icon="edit"
              ariaLabel="Open settings"
              isOverridden
            />
          </td>
        </tr>
        <tr className="border-b border-glyph-stroke">
          <td className={rowLabel}>Error</td>
          <td className={cell}>
            <BulkRenderingShotSettingsRow
              label="Render engine"
              value="Unique settings"
              icon="edit"
              ariaLabel="Open settings"
              hasError
            />
          </td>
        </tr>
        <tr>
          <td className={rowLabel}>Run view (visibility icon)</td>
          <td className={cell}>
            <BulkRenderingShotSettingsRow
              label="Render engine"
              value="Seedance 2"
              icon="visibility"
              ariaLabel="View settings"
            />
          </td>
        </tr>
      </tbody>
    </table>
  )
};
