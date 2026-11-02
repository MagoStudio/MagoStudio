import { ProjectRow } from "@home/components/dashboard/ProjectRow";
import { Meta } from "@storybook/react-vite";

const noop = (_id: string) => {};
const noopDelete = (_e: React.MouseEvent, _id: string) => {};

const meta: Meta = {
  title: "Dashboard/ProjectRow",
  parameters: {
    layout: "padded"
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="bg-surface-secondary w-[500px] rounded p-2">
        <Story />
      </div>
    )
  ]
};

export default meta;

export const Default = {
  name: "Default (no image)",
  render: () => (
    <ProjectRow
      id="project-1"
      name="Electric SUV Launch by Beta Automotive"
      imageUrl=""
      onClick={noop}
      onDelete={noopDelete}
    />
  )
};

export const WithImage = {
  name: "With thumbnail image",
  render: () => (
    <ProjectRow
      id="project-2"
      name="Performance Coupe by Zeta Automotive"
      imageUrl="https://picsum.photos/seed/project/57/32"
      onClick={noop}
      onDelete={noopDelete}
    />
  )
};

export const Loading = {
  name: "Loading (skeleton)",
  render: () => <ProjectRow isLoading />
};
