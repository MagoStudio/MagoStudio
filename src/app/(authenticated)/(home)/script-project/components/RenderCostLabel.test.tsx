import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { RenderCostLabel } from "./RenderCostLabel";

describe("RenderCostLabel", () => {
  test("shows Local for a ComfyUI script-project render", () => {
    const { getByText } = render(
      <RenderCostLabel cost={{ kind: "local" }} isDisabled={false} />
    );

    expect(getByText("Local")).toBeInTheDocument();
  });

  test("shows a credit amount for a Mago cloud script-project render", () => {
    const { getByText } = render(
      <RenderCostLabel
        cost={{ kind: "credits", amount: 120 }}
        isDisabled={false}
      />
    );

    expect(getByText("120")).toBeInTheDocument();
  });

  test("shows nothing while provider provenance is unresolved", () => {
    const { container } = render(
      <RenderCostLabel cost={null} isDisabled={false} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
