import { UploadButtonGlyph } from "@components/UploadButtonGlyph";
import { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Graphics/UploadButtonGlyph",
  component: UploadButtonGlyph,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof UploadButtonGlyph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
