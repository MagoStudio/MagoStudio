import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { NothingToGenerateReason } from "./NothingToGenerateReason";

const setup = ({
  isPending = false,
  isPriceLoading = false,
  reason
}: {
  isPending?: boolean;
  isPriceLoading?: boolean;
  reason?: string;
}) =>
  renderWithProviders(
    <NothingToGenerateReason
      reason={reason}
      isPending={isPending}
      isPriceLoading={isPriceLoading}
      testId="generate"
    />
  );

describe("NothingToGenerateReason", () => {
  it("says why there is nothing to generate", () => {
    const screen = setup({ reason: "No changes since the last generation" });

    expect(screen.getByTestId("generate-nothing-to-generate").textContent).toBe(
      "No changes since the last generation"
    );
  });

  it("drops the reason while the price reloads or a run starts", () => {
    const reason = "No changes since the last generation";

    expect(
      setup({ reason, isPriceLoading: true }).queryByTestId(
        "generate-nothing-to-generate"
      )
    ).toBeNull();
    expect(
      setup({ reason, isPending: true }).queryByTestId(
        "generate-nothing-to-generate"
      )
    ).toBeNull();
  });

  it("shows no reason when none is given", () => {
    expect(setup({}).queryByTestId("generate-nothing-to-generate")).toBeNull();
  });
});
