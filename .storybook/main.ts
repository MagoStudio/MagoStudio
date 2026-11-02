import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import type { StorybookConfig } from "@storybook/react-vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
import { mergeAlias } from "vite";
import svgr from "vite-plugin-svgr";

const clerkReactMockPath = resolve(__dirname, "../__mocks__/@clerk/react.ts");
const nextNavigationMockPath = resolve(
  __dirname,
  "../__mocks__/next/navigation.ts"
);
const useUploadReferenceImageMockPath = resolve(
  __dirname,
  "../__mocks__/@domains/asset/useUploadReferenceImage.ts"
);
const useVideoAssetMockPath = resolve(
  __dirname,
  "../__mocks__/@domains/asset/useVideoAsset.ts"
);

const config: StorybookConfig = {
  stories: ["../src/stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-mcp"],
  framework: "@storybook/react-vite",
  previewHead: (head) => `
    ${head}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap" rel="stylesheet" />
    <style>
      .sb-main-padded { padding: 0 !important; }
    </style>
  `,
  viteFinal: async (config) => {
    return {
      ...config,
      define: {
        ...config.define,
        "process.env": Object.fromEntries(
          Object.entries(process.env).filter(([key]) =>
            key.startsWith("NEXT_PUBLIC_")
          )
        )
      },
      resolve: {
        ...config.resolve,
        tsconfigPaths: true,
        extensions: [
          ".local.tsx",
          ".local.ts",
          ".local.jsx",
          ".local.js",
          ".tsx",
          ".ts",
          ".jsx",
          ".js",
          ".json"
        ],
        alias: mergeAlias(config.resolve?.alias, {
          "@clerk/react": clerkReactMockPath,
          "@platform/identity": clerkReactMockPath,
          "next/navigation": nextNavigationMockPath,
          "@domains/asset/useUploadReferenceImage":
            useUploadReferenceImageMockPath,
          "@domains/asset/useVideoAsset": useVideoAssetMockPath
        })
      },
      plugins: [
        ...(config.plugins ?? []),
        svgr({
          include: "**/*.svg",
          svgrOptions: {
            exportType: "default",
            plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
            svgoConfig: {
              plugins: [
                {
                  name: "preset-default",
                  params: {
                    overrides: {
                      removeViewBox: false,
                      convertShapeToPath: false
                    }
                  }
                },
                "removeDimensions"
              ]
            }
          }
        })
      ]
    };
  }
};
export default config;
