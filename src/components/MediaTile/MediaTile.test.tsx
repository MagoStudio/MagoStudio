import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { MediaTile } from "./index";

describe("MediaTile", () => {
  test("shows an unavailable placeholder and retries a failed thumbnail", () => {
    const { container } = render(
      <MediaTile
        tilePresentation="asset"
        thumbnailUrl="mago-media://asset/broken"
      />
    );
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByRole("status")).toHaveTextContent("Media unavailable");
    expect(container.querySelector("img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "mago-media://asset/broken"
    );
  });
  test("renders the thumbnail image when a thumbnailUrl is given", () => {
    const { container } = render(
      <MediaTile
        tilePresentation="asset"
        thumbnailUrl="https://example.com/frame.png"
      />
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/frame.png"
    );
  });

  test("renders no image when thumbnailUrl is absent", () => {
    const { container } = render(<MediaTile tilePresentation="asset" />);

    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  test("renders the labelPill, actions and footer slots", () => {
    render(
      <MediaTile
        tilePresentation="asset"
        labelPill={<span>Frame 87</span>}
        actions={<button type="button">Delete</button>}
        footer={<span>Edit Key-frame 0</span>}
      />
    );

    expect(screen.getByText("Frame 87")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByText("Edit Key-frame 0")).toBeInTheDocument();
  });

  test("renders the shimmer when tilePresentation is shimmer and there is no thumbnail", () => {
    const { container } = render(<MediaTile tilePresentation="shimmer" />);

    expect(
      container.querySelector(".animate-mago-shimmer")
    ).toBeInTheDocument();
  });

  test("renders centeredContent when there is no thumbnail and no loading state", () => {
    render(
      <MediaTile
        tilePresentation="asset"
        centeredContent={<span>Nothing has been generated</span>}
      />
    );

    expect(screen.getByText("Nothing has been generated")).toBeInTheDocument();
  });

  test("prefers the shimmer over centeredContent when both are given", () => {
    const { container } = render(
      <MediaTile
        tilePresentation="shimmer"
        centeredContent={<span>Nothing has been generated</span>}
      />
    );

    expect(
      container.querySelector(".animate-mago-shimmer")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Nothing has been generated")
    ).not.toBeInTheDocument();
  });

  test("renders black with no shimmer or centeredContent when tilePresentation is black", () => {
    render(
      <MediaTile
        tilePresentation="black"
        isLoading
        centeredContent={<span>Nothing has been generated</span>}
      />
    );

    expect(
      screen.queryByText("Nothing has been generated")
    ).not.toBeInTheDocument();
  });

  test("renders overlay content instead of the image chrome when given", () => {
    const { container } = render(
      <MediaTile
        tilePresentation="asset"
        thumbnailUrl="https://example.com/frame.png"
        labelPill={<span>Frame 87</span>}
        overlay={<span>Uploading 30%</span>}
      />
    );

    expect(screen.getByText("Uploading 30%")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.queryByText("Frame 87")).not.toBeInTheDocument();
  });
});
