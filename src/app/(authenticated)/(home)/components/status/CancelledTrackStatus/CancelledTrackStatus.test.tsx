import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CancelledTrackStatus } from "./index";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

describe("CancelledTrackStatus", () => {
  it("renders the localized label, not a hardcoded string", () => {
    render(<CancelledTrackStatus />);

    expect(screen.getByText("status.cancelled.label")).toBeInTheDocument();
    expect(screen.queryByText("Cancelled")).not.toBeInTheDocument();
  });
});
