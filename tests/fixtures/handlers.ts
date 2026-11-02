import { createBalance } from "@tests/factories/balance";
import {
  createDefaultPaymentPrices,
  createDefaultSubscriptionPrices
} from "@tests/factories/prices";
import { createProjectListData } from "@tests/factories/projectList";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const handlers = [
  // Auth API
  http.post(`**/auth`, () => {
    return HttpResponse.json({
      api_key: "test-api-key-123",
      key_id: "test-key-id",
      enabled: true
    });
  }),

  // Homepage API (paginated)
  http.get(`**/projects/homepage/list`, () => {
    return HttpResponse.json(createProjectListData(2));
  }),

  // Projects list API (used by ProjectFoldersTreeProvider)
  http.get(`**/v03/projects`, () => {
    return HttpResponse.json([]);
  }),

  // Queue API
  http.get(`**/queue`, () => {
    return HttpResponse.json([]);
  }),

  // Assets API
  http.get(`**/assets/:assetId`, () => {
    return HttpResponse.json({
      id: "mock-asset-id",
      status: "finished"
    });
  }),

  // Payment APIs
  http.get(`**/prices`, () => {
    return HttpResponse.json({
      payment: createDefaultPaymentPrices(),
      subscription: createDefaultSubscriptionPrices()
    });
  }),

  http.get(`**/balance`, () => {
    return HttpResponse.json(createBalance());
  })
];

export const mockServer = setupServer(...handlers);
