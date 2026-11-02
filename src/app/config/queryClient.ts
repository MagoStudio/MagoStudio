"use client";

import { MINUTE } from "@constants";
import { isServer, QueryClient } from "@tanstack/react-query";

const GARBAGE_COLLECTION_TIME_MINUTES = 30;

const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        gcTime: GARBAGE_COLLECTION_TIME_MINUTES * MINUTE
      },
      mutations: {
        gcTime: GARBAGE_COLLECTION_TIME_MINUTES * MINUTE
      }
    }
  });
};

let browserQueryClient: QueryClient | undefined = undefined;

export const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};
