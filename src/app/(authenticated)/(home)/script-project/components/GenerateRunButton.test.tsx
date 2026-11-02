import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/renderWithProviders";

import { GenerateRunButton } from "./GenerateRunButton";

const setup = ({
  isPending = false,
  isPriceLoading = false,
  nothingToGenerateReason
}: {
  isPending?: boolean;
  isPriceLoading?: boolean;
  nothingToGenerateReason?: string;
}) =>
  renderWithProviders(
    <GenerateRunButton
      label="Generate"
      countLabel="(0)"
      cost={{ kind: "credits", amount: 0 }}
      isDisabled
      isPending={isPending}
      isPriceLoading={isPriceLoading}
      nothingToGenerateReason={nothingToGenerateReason}
      onPress={vi.fn()}
      testId="generate"
    />
  );

describe("GenerateRunButton", () => {
  it("says why there is nothing to generate", () => {
    const screen = setup({
      nothingToGenerateReason: "No changes since the last generation"
    });

    expect(screen.getByTestId("generate-nothing-to-generate").textContent).toBe(
      "No changes since the last generation"
    );
  });

  it("drops the reason while the price reloads or a run starts", () => {
    const reason = "No changes since the last generation";

    expect(
      setup({
        nothingToGenerateReason: reason,
        isPriceLoading: true
      }).queryByTestId("generate-nothing-to-generate")
    ).toBeNull();
    expect(
      setup({ nothingToGenerateReason: reason, isPending: true }).queryByTestId(
        "generate-nothing-to-generate"
      )
    ).toBeNull();
  });

  it("shows no reason when none is given", () => {
    expect(setup({}).queryByTestId("generate-nothing-to-generate")).toBeNull();
  });
});
