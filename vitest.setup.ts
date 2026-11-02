import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { baseUser } from "@tests/factories/user";
import { mockServer } from "@tests/fixtures/handlers";
import { configMocks, mockAnimationsApi } from "jsdom-testing-mocks";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

// Main-process suites opt into the node environment with a
// `@vitest-environment node` docblock, where there is no DOM to mock. Everything
// browser-specific below is guarded so one shared setup serves both.
const isBrowserLike = typeof window !== "undefined";

if (isBrowserLike) {
  configMocks({ afterEach, beforeEach, afterAll, beforeAll });
  mockAnimationsApi();
}

// Vitest hoists module mocks, so these declarations must stay at module scope.
// Spreading the identity facade preserves non-hook exports used by desktop tests.
vi.mock("@platform/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/identity")>()),
  useUser: () => ({
    user: baseUser
  }),
  useAuth: () => ({
    getToken: () => "token"
  })
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: () => ""
  }),
  usePathname: () => "",
  useRouter: () => ({
    replace: vi.fn()
  })
}));

beforeAll(() => {
  // MSW exists to stub HTTP for browser-side component tests. Main-process
  // suites run in the node environment and talk to real sockets or their own
  // local servers; MSW's interceptor replaces the socket with a MockHttpSocket
  // that cannot carry a streamed TLS upload (the read fails with EINVAL).
  if (isBrowserLike) mockServer.listen();
});

afterEach(() => {
  if (isBrowserLike) {
    cleanup();
    mockServer.resetHandlers();
  }
});

afterAll(() => {
  if (isBrowserLike) mockServer.close();
});

// Mock URL.createObjectURL and revokeObjectURL (not available in jsdom)
if (isBrowserLike) {
  global.URL.createObjectURL = vi.fn(() => "mock-url");
  global.URL.revokeObjectURL = vi.fn();
}

if (isBrowserLike) {
  // Mock window.matchMedia (required for embla-carousel and other libraries)
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  // Mock IntersectionObserver (not available in jsdom)
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly scrollMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }
  global.IntersectionObserver = MockIntersectionObserver;

  // Mock ResizeObserver (not available in jsdom)
  class MockResizeObserver implements ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  global.ResizeObserver = MockResizeObserver;
}
