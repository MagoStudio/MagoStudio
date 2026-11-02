import { Icon } from "@components/Icon";
import { IconActionButton } from "@components/IconActionButton";
import { QueueRenderItem } from "@components/QueueRenderItem/QueueRenderItem";
import { Text } from "@components/Text";
import { AssetStatus } from "@schemas/asset";
import { type Meta, type StoryObj } from "@storybook/react-vite";

const noop = () => {};

const PanelShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-surface-primary min-h-screen flex justify-end p-4">
    <div className="w-[672px] flex flex-col bg-surface-secondary-opacity-90 backdrop-blur-md rounded-[20px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="flex items-center gap-2 pl-4 pr-3 py-4 shrink-0">
        <Text
          component="p"
          variant="md"
          weight="bold"
          color="glyph-primary"
          className="flex-1"
        >
          Queue
        </Text>
        <IconActionButton
          icon={<Icon iconSet="24" iconName="close" />}
          size="sm"
          onPress={noop}
          aria-label="Close"
          className="shrink-0"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom px-4 pb-4">
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  </div>
);

const Section: React.FC<{
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  emptyText?: string;
}> = ({ title, subtitle, children, emptyText }) => (
  <div className="flex flex-col gap-2">
    <Text variant="sm" weight="bold" color="glyph-primary">
      {title}
    </Text>
    {subtitle && (
      <Text variant="xs" color="glyph-tertiary">
        {subtitle}
      </Text>
    )}
    {emptyText && !children && (
      <Text variant="xs" color="glyph-tertiary">
        {emptyText}
      </Text>
    )}
    {children}
  </div>
);

const baseItem = {
  frameRange: [1, 100] as [number, number],
  cost: 100,
  onClick: noop,
  onDelete: noop
};

const meta = {
  title: "Queue/QueuePanel",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  render: () => (
    <PanelShell>
      <Section title="In progress" emptyText="No jobs" />
      <Section title="Waiting" emptyText="No jobs are waiting" />
      <Section title="Completed" subtitle="We are keeping history for 3 days" />
    </PanelShell>
  )
};

export const WithItems: Story = {
  render: () => (
    <PanelShell>
      <Section title="In progress">
        <QueueRenderItem
          {...baseItem}
          projectName="01_01_In the Cafe (30)"
          shotName="01_01_In the Cafe"
          trackName="Sunset chase"
          status={AssetStatus.INPROGRESS}
          progress={45}
          statusText="00:05:01"
          statusColor="glyph-warning"
          isCancelable={true}
        />
        <QueueRenderItem
          {...baseItem}
          projectName="01_02_In the Cafe (30)"
          shotName="01_01_In the Cafe"
          trackName="Sunset chase"
          status={AssetStatus.INPROGRESS}
          progress={20}
          statusText="00:05:01"
          statusColor="glyph-warning"
          isCancelable={true}
        />
      </Section>

      <Section title="Waiting" emptyText="No jobs are waiting" />

      <Section title="Completed" subtitle="We are keeping history for 3 days">
        <QueueRenderItem
          {...baseItem}
          projectName="01_03_In the Cafe (32)"
          shotName="01_03_In the Cafe"
          trackName="Sunset chase"
          status={AssetStatus.FINISHED}
          progress={100}
          statusText="Done"
          statusColor="glyph-success"
          renderDuration="00:15:00"
          isCancelable={false}
        />
      </Section>
    </PanelShell>
  )
};

export const MixedStates: Story = {
  render: () => (
    <PanelShell>
      <Section title="In progress">
        <QueueRenderItem
          {...baseItem}
          projectName="01_01_In the Cafe (30)"
          shotName="01_01_In the Cafe"
          trackName="Sunset chase"
          status={AssetStatus.INPROGRESS}
          progress={65}
          statusText="00:02:30"
          statusColor="glyph-warning"
          isCancelable={true}
        />
      </Section>

      <Section title="Waiting">
        <QueueRenderItem
          {...baseItem}
          projectName="01_02_Park (1)"
          shotName="01_02_Park"
          trackName="Habillage Stand Eureka Park"
          status={AssetStatus.PENDING}
          progress={0}
          statusText="Queue: 2nd"
          statusColor="glyph-primary"
          isCancelable={true}
        />
        <QueueRenderItem
          {...baseItem}
          projectName="01_03_Park (2)"
          shotName="01_03_Park"
          trackName="Background wide shot"
          status={AssetStatus.INQUEUE}
          progress={0}
          statusText="Queue: 3rd"
          statusColor="glyph-primary"
          isCancelable={true}
        />
      </Section>

      <Section title="Completed" subtitle="We are keeping history for 3 days">
        <QueueRenderItem
          {...baseItem}
          projectName="01_03_In the Cafe (32)"
          shotName="01_03_In the Cafe"
          trackName="Sunset chase"
          status={AssetStatus.FINISHED}
          progress={100}
          statusText="Done"
          statusColor="glyph-success"
          renderDuration="00:15:00"
          isCancelable={false}
        />
        <QueueRenderItem
          {...baseItem}
          projectName="01_04_Bridge (5)"
          shotName="01_04_Bridge"
          trackName="Sunset panorama"
          status={AssetStatus.ERROR}
          progress={0}
          statusText="Failed"
          statusColor="glyph-error"
          isCancelable={false}
        />
      </Section>
    </PanelShell>
  )
};
