import { AssetStatus } from "@schemas/asset";
import { describe, expect, test, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { QueueRenderItem } from "./QueueRenderItem";

describe("QueueRenderItem unviewed-render dot", () => {
  test("renders the dot with token-driven fill classes, not hardcoded hex", () => {
    const { getByTestId } = renderWithProviders(
      <QueueRenderItem
        projectName="Project"
        shotName="Shot"
        trackName="Track"
        status={AssetStatus.FINISHED}
        progress={100}
        frameRange={[0, 100]}
        cost={10}
        statusText="Finished"
        statusColor="glyph-success"
        interactedWith={false}
        isCancelable={false}
        onClick={vi.fn()}
      />
    );

    const dot = getByTestId("queue-item-unviewed-dot");
    const fillElements = Array.from(dot.querySelectorAll("path"));

    expect(fillElements).toHaveLength(2);
    expect(fillElements[0].getAttribute("fill")).toBeNull();
    expect(fillElements[1].getAttribute("fill")).toBeNull();
    expect(fillElements[0].getAttribute("class")).toContain(
      "fill-glyph-success"
    );
    expect(fillElements[1].getAttribute("class")).toContain(
      "fill-glyph-success-hover"
    );
  });
});

const baseProps = {
  projectName: "Project",
  shotName: "Shot",
  trackName: "Track",
  status: AssetStatus.FINISHED,
  progress: 100,
  frameRange: [0, 100] as [number, number],
  cost: 10,
  statusText: "Finished",
  statusColor: "glyph-success" as const,
  isCancelable: false,
  onClick: vi.fn()
};

describe("QueueRenderItem provider cost", () => {
  test("labels Mago cloud cost as credits", () => {
    const { getByText } = renderWithProviders(
      <QueueRenderItem {...baseProps} costUnit="credits" />
    );

    expect(getByText("Cost: 10 credits")).toBeInTheDocument();
  });

  test("labels fal cost in dollars", () => {
    const { getByText } = renderWithProviders(
      <QueueRenderItem {...baseProps} cost={0.25} costUnit="usd" />
    );

    expect(getByText("Cost: $0.25 est.")).toBeInTheDocument();
  });

  test("omits cost for local ComfyUI renders", () => {
    const { queryByText } = renderWithProviders(
      <QueueRenderItem {...baseProps} costUnit={null} />
    );

    expect(queryByText(/^Cost:/)).not.toBeInTheDocument();
  });
});
