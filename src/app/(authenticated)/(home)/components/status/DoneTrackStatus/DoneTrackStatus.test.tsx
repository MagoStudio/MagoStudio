import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DoneTrackStatus } from "./index";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

describe("DoneTrackStatus", () => {
  it("renders the localized label, not a hardcoded string", () => {
    render(<DoneTrackStatus />);

    expect(screen.getByText("status.done.label")).toBeInTheDocument();
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });
});
