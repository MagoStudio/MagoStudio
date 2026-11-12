import "@config/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { LocalSettingsDebugTab } from "./LocalSettingsDebugTab";

it("loads debug info on entering its tab without an accordion", async () => {
  const previous = Object.getOwnPropertyDescriptor(window, "mago");
  const diagnostics = vi.fn().mockResolvedValue({ version: "test" });
  Object.defineProperty(window, "mago", {
    configurable: true,
    value: { models: { diagnostics } }
  });
  try {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LocalSettingsDebugTab endpoint="http://localhost:8188" />
      </QueryClientProvider>
    );
    expect(await screen.findByRole("textbox")).toHaveValue(
      JSON.stringify({ version: "test" }, null, 2)
    );
    expect(diagnostics).toHaveBeenCalledWith("http://localhost:8188");
    expect(
      screen.queryByRole("button", { expanded: false })
    ).not.toBeInTheDocument();
  } finally {
    if (previous) Object.defineProperty(window, "mago", previous);
    else Reflect.deleteProperty(window, "mago");
  }
});
