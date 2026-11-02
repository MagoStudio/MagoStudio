import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { ProjectCard } from "./ProjectCard";

const renderCard = (origin: "local" | "cloud") =>
  renderWithProviders(
    <ProjectCard
      title="A project"
      date={new Date("2026-09-18T10:00:00Z")}
      subtitle="1 shot"
      image=""
      origin={origin}
    />
  );

describe("ProjectCard origin marker", () => {
  it("does not mark projects created on this machine", () => {
    renderCard("local");
    expect(
      screen.queryByTestId("project-origin-local")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("project-origin-cloud")
    ).not.toBeInTheDocument();
  });

  it("shows a cloud icon for projects mirrored from Mago Cloud", () => {
    renderCard("cloud");
    const marker = screen.getByTestId("project-origin-cloud");
    expect(marker).toHaveAccessibleName("Project origin: cloud");
    expect(marker).not.toHaveTextContent("Cloud");
    expect(marker).toHaveClass("rounded-full", "bg-[#075cff]", "text-white");
  });

  it("replaces a failed preview URL with a gradient", () => {
    renderWithProviders(
      <ProjectCard
        title="Broken preview"
        date={new Date("2026-09-18T10:00:00Z")}
        subtitle="1 shot"
        image="mago-media://thumbnail/missing"
      />
    );

    fireEvent.error(screen.getByRole("img", { name: "Broken preview" }));

    expect(
      screen.queryByRole("img", { name: "Broken preview" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("project-preview-fallback")).toBeInTheDocument();
  });
});
