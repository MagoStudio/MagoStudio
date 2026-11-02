import { readFileSync, writeFileSync } from "node:fs";

import withBundleAnalyzer from "@next/bundle-analyzer";

// Single source of truth, shared with the main process. Environment variables
// override it so a build can be pointed at dev or staging without edits.
const cloud = JSON.parse(
  readFileSync(new URL("./desktop/shared/cloud.json", import.meta.url), "utf8")
);

// The renderer bakes its Clerk key and backend URL in at build time, while the
// main process builds the CSP that has to allow them. If the two disagree,
// clerk-js is silently blocked and the app just reports that it cannot reach the
// cloud. Writing the resolved values out here makes the main process read
// exactly what this bundle was built with.
const resolvedCloud = {
  ...cloud,
  clerkPublishableKey:
    process.env.MAGO_CLERK_PUBLISHABLE_KEY || cloud.clerkPublishableKey,
  backendUrl: process.env.MAGO_BACKEND_URL || cloud.backendUrl,
  rendererHost: process.env.MAGO_RENDERER_HOST || cloud.rendererHost,
  cloudStorageHosts: process.env.MAGO_CLOUD_STORAGE_HOSTS
    ? process.env.MAGO_CLOUD_STORAGE_HOSTS.split(",")
    : cloud.cloudStorageHosts
};
writeFileSync(
  new URL("./desktop/shared/cloud.generated.json", import.meta.url),
  `${JSON.stringify(resolvedCloud, null, 2)}
`
);

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

const localResolveExtensions = [
  ".local.tsx",
  ".local.ts",
  ".local.jsx",
  ".local.js"
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", resolvedCloud.rendererHost],
  env: {
    NEXT_PUBLIC_MAGO_STUDIO: "true",
    NEXT_PUBLIC_PUBLISHABLE_KEY: resolvedCloud.clerkPublishableKey,
    NEXT_PUBLIC_BACKEND_URL: resolvedCloud.backendUrl
  },
  reactCompiler: true,
  typedRoutes: true,
  trailingSlash: true,
  output: "export",
  images: { unoptimized: true },
  logging: { browserToTerminal: true },
  experimental: {
    turbopackRustReactCompiler: true,
    turbopackMemoryEviction: "full"
  },
  webpack: (config) => {
    config.resolve.extensions = [
      ...localResolveExtensions,
      ...config.resolve.extensions
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false
    };
    return config;
  },
  turbopack: {
    resolveExtensions: [
      ...localResolveExtensions,
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".json"
    ],
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              svgo: true,
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
          }
        ],
        as: "*.js"
      }
    }
  }
};

export default withAnalyzer(nextConfig);
