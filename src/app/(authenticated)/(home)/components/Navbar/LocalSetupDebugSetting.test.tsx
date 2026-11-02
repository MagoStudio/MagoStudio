import { LOCAL_SETUP_DEBUG_ENABLED_KEY } from "@hooks/userLocalStorage/useLocalSetupDebugSetting";
import { fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { LocalSetupDebugSetting } from "./LocalSetupDebugSetting";

beforeEach(() => window.localStorage.clear());

describe("setup wizard debug tools setting", () => {
  it("starts off and remembers when it is turned on", () => {
    const screen = renderWithProviders(<LocalSetupDebugSetting />);
    const checkbox = screen.getByLabelText("Setup wizard debug tools");

    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(window.localStorage.getItem(LOCAL_SETUP_DEBUG_ENABLED_KEY)).toBe(
      "true"
    );
  });
});
