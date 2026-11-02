import { i18n } from "@config/i18n";
import { getQueryClient } from "@config/queryClient";
import { AspectRatioProvider } from "@context/AspectRatioContext";
import { IsReferenceImageUploadingProvider } from "@context/IsReferenceImageUploading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

type Providers = {
  withAppProviders?: boolean;
  queryClient?: QueryClient;
};

const AppProviders = ({ children }: { children: ReactNode }) => (
  <AspectRatioProvider>
    <IsReferenceImageUploadingProvider>
      {children}
    </IsReferenceImageUploadingProvider>
  </AspectRatioProvider>
);

export const renderWithProviders = (
  ui: ReactElement,
  {
    withAppProviders = false,
    queryClient,
    ...renderOptions
  }: Providers & Omit<RenderOptions, "wrapper"> = {}
): RenderResult => {
  const client = queryClient ?? getQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        {withAppProviders ? <AppProviders>{children}</AppProviders> : children}
      </QueryClientProvider>
    </I18nextProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
