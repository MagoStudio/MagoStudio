import { QueueRenderItem } from "@components/QueueRenderItem/QueueRenderItem";
import { Text } from "@components/Text";
import { AssetStatus } from "@schemas/asset";
import { type Meta, type StoryObj } from "@storybook/react-vite";

const noop = () => {};

const meta = {
  title: "Queue/QueueRenderItem",
  component: QueueRenderItem,
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof QueueRenderItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseProps = {
  projectName: "01_02_Park (1)",
  shotName: "01_02_Park",
  trackName: "Habillage Stand Eureka Park",
  frameRange: [1, 100] as [number, number],
  cost: 100,
  onClick: noop,
  onDelete: noop
};

export const AllStates: Story = {
  args: {
    ...baseProps,
    status: AssetStatus.PENDING,
    progress: 0,
    statusText: "In Queue: 5th",
    statusColor: "glyph-primary",
    isCancelable: true
  },
  render: () => (
    <div className="bg-surface-secondary p-6 min-h-screen w-[700px]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Waiting (Pending) — deletable
          </Text>
          <QueueRenderItem
            {...baseProps}
            status={AssetStatus.PENDING}
            progress={0}
            statusText="Queue: 5th"
            statusColor="glyph-primary"
            isCancelable={true}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            In Progress — deletable
          </Text>
          <QueueRenderItem
            {...baseProps}
            projectName="01_03_In the Cafe (30)"
            shotName="01_01_In the Cafe"
            trackName="Sunset chase"
            status={AssetStatus.INPROGRESS}
            progress={40}
            statusText="00:05:01"
            statusColor="glyph-warning"
            isCancelable={true}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Completed — unviewed (green dot)
          </Text>
          <QueueRenderItem
            {...baseProps}
            projectName="01_03_In the Cafe (32)"
            shotName="01_03_In the Cafe"
            trackName="Sunset chase"
            status={AssetStatus.FINISHED}
            progress={100}
            statusText="Done"
            statusColor="glyph-success"
            renderDuration="00:15:00"
            interactedWith={false}
            isCancelable={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Completed — viewed (no dot)
          </Text>
          <QueueRenderItem
            {...baseProps}
            projectName="01_03_In the Cafe (32)"
            shotName="01_03_In the Cafe"
            trackName="Sunset chase"
            status={AssetStatus.FINISHED}
            progress={100}
            statusText="Done"
            statusColor="glyph-success"
            renderDuration="00:15:00"
            interactedWith={true}
            isCancelable={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Text
            component="div"
            variant="xs"
            color="glyph-secondary"
            weight="medium"
          >
            Failed — folder icon
          </Text>
          <QueueRenderItem
            {...baseProps}
            status={AssetStatus.ERROR}
            progress={0}
            statusText="Failed"
            statusColor="glyph-error"
            isCancelable={false}
          />
        </div>
      </div>
    </div>
  )
};

export const Waiting: Story = {
  args: {
    ...baseProps,
    status: AssetStatus.PENDING,
    progress: 0,
    statusText: "Queue: 5th",
    statusColor: "glyph-primary",
    isCancelable: true
  },
  render: (args) => (
    <div className="bg-surface-secondary p-6 w-[700px]">
      <QueueRenderItem {...args} />
    </div>
  )
};

export const InProgress: Story = {
  args: {
    ...baseProps,
    projectName: "01_03_In the Cafe (30)",
    shotName: "01_01_In the Cafe",
    trackName: "Sunset chase",
    status: AssetStatus.INPROGRESS,
    progress: 40,
    statusText: "00:05:01",
    statusColor: "glyph-warning",
    isCancelable: true
  },
  render: (args) => (
    <div className="bg-surface-secondary p-6 w-[700px]">
      <QueueRenderItem {...args} />
    </div>
  )
};

export const Completed: Story = {
  args: {
    ...baseProps,
    projectName: "01_03_In the Cafe (32)",
    shotName: "01_03_In the Cafe",
    trackName: "Sunset chase",
    status: AssetStatus.FINISHED,
    progress: 100,
    statusText: "Done",
    statusColor: "glyph-success",
    renderDuration: "00:15:00",
    interactedWith: true,
    isCancelable: false
  },
  render: (args) => (
    <div className="bg-surface-secondary p-6 w-[700px]">
      <QueueRenderItem {...args} />
    </div>
  )
};

export const CompletedUnviewed: Story = {
  args: {
    ...baseProps,
    projectName: "01_03_In the Cafe (32)",
    shotName: "01_03_In the Cafe",
    trackName: "Sunset chase",
    status: AssetStatus.FINISHED,
    progress: 100,
    statusText: "Done",
    statusColor: "glyph-success",
    renderDuration: "00:15:00",
    interactedWith: false,
    isCancelable: false
  },
  render: (args) => (
    <div className="bg-surface-secondary p-6 w-[700px]">
      <QueueRenderItem {...args} />
    </div>
  )
};

export const Failed: Story = {
  args: {
    ...baseProps,
    status: AssetStatus.ERROR,
    progress: 0,
    statusText: "Failed",
    statusColor: "glyph-error",
    isCancelable: false
  },
  render: (args) => (
    <div className="bg-surface-secondary p-6 w-[700px]">
      <QueueRenderItem {...args} />
    </div>
  )
};
