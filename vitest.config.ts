import react from "@vitejs/plugin-react-swc";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
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
    ]
  },
  plugins: [
    react(),
    {
      name: "svg-transform",
      transform(_code: string, id: string) {
        if (id.endsWith(".svg")) {
          // Transform SVG imports into React components for tests
          return {
            code: `export default () => null;`,
            map: null
          };
        }
      }
    }
  ],
  test: {
    // Heavy page tests (e.g. home.test.tsx renders the full HomePage tree) can
    // exceed the 5s default under CI parallel load, causing timeout flakes.
    // Give them headroom — a genuine hang still fails, just a bit later.
    testTimeout: 15000,
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: [...configDefaults.exclude, "**/*.dom.test.ts"]
        }
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["**/*.test.tsx", "**/*.dom.test.ts"],
          setupFiles: ["./vitest.setup.ts"]
        }
      }
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/*.stories.{ts,tsx}",
        "src/**/index.ts",
        "src/app/config/**",
        "src/**/*.d.ts"
      ]
    }
  }
});
