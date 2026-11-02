import { describe, expect, test } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { FileDropZone } from "./index";

describe("FileDropZone", () => {
  test("renders the upload prompt and accepts a file input", () => {
    const { container, getByText } = renderWithProviders(<FileDropZone />, {
      withAppProviders: true
    });

    expect(getByText("Upload files")).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
  });
});
