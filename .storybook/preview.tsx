import { i18n } from "@config/i18n";
import { getQueryClient } from "@config/queryClient";
import type { Preview } from "@storybook/react-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { I18nextProvider } from "react-i18next";
import "@app/globals.css";

const preview: Preview = {
  decorators: [
    (Story) => {
      document.body.style.background = "#3D3D3D";
      return (
        <QueryClientProvider client={getQueryClient()}>
          <I18nextProvider i18n={i18n}>
            <Story />
          </I18nextProvider>
        </QueryClientProvider>
      );
    }
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#3D3D3D" }]
    },
    options: {
      showRoots: false,
      storySort: {
        order: ["Overview", "Colors", "Icons", "Information", "Components"]
      }
    }
  }
};

export default preview;
