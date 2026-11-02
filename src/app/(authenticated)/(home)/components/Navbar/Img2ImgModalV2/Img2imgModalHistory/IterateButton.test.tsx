import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { Img2ImgSchema, Img2ImgType } from "../schemas";

import { IterateButton } from "./IterateButton";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

type HarnessProps = {
  assetId: string;
  sourceFrame?: number;
  initialPlayheadFrame: number;
  onValues: (values: Img2ImgType) => void;
};

const Harness: React.FC<HarnessProps> = ({
  assetId,
  sourceFrame,
  initialPlayheadFrame,
  onValues
}) => {
  const defaultValues = Img2ImgSchema.parse({
    model: "nanobanana_pro",
    frameType: "video",
    prompt: "test prompt"
  });

  const methods = useForm<Img2ImgType>({
    defaultValues,
    shouldUnregister: false
  });

  return (
    <FormProvider {...methods}>
      <IterateButton assetId={assetId} sourceFrame={sourceFrame} />
      <button
        type="button"
        data-testid="read-values"
        onClick={() => onValues(methods.getValues())}
      >
        read
      </button>
      <output data-testid="playhead">{initialPlayheadFrame}</output>
    </FormProvider>
  );
};

const WatchedIteratedAssetId: React.FC = () => {
  const value = useWatch<Img2ImgType, "iteratedAssetId">({
    name: "iteratedAssetId"
  });
  return <output data-testid="watched-asset-id">{value ?? ""}</output>;
};

const WatchedUploadedImageId: React.FC = () => {
  const value = useWatch<Img2ImgType, "uploadedImageId">({
    name: "uploadedImageId"
  });
  return <output data-testid="watched-uploaded-id">{value ?? ""}</output>;
};

describe("IterateButton", () => {
  it("sets iteratedAssetId and iteratedSourceFrame on the form when clicked", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();

    render(
      <Harness
        assetId="asset-123"
        sourceFrame={20}
        initialPlayheadFrame={5}
        onValues={onValues}
      />
    );

    await user.click(screen.getByRole("button", { name: "Iterate" }));
    await user.click(screen.getByTestId("read-values"));

    expect(onValues).toHaveBeenCalled();
    const values = onValues.mock.calls[onValues.mock.calls.length - 1][0];
    expect(values.iteratedAssetId).toBe("asset-123");
    expect(values.iteratedSourceFrame).toBe(20);
    expect(values.frameType).toBe("upload");
    expect(values.uploadedImageId).toBeUndefined();
  });

  it("leaves iteratedSourceFrame undefined when sourceFrame prop is omitted", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();

    render(
      <Harness
        assetId="asset-456"
        initialPlayheadFrame={0}
        onValues={onValues}
      />
    );

    await user.click(screen.getByRole("button", { name: "Iterate" }));
    await user.click(screen.getByTestId("read-values"));

    const values = onValues.mock.calls[onValues.mock.calls.length - 1][0];
    expect(values.iteratedAssetId).toBe("asset-456");
    expect(values.iteratedSourceFrame).toBeUndefined();
    expect(values.frameType).toBe("upload");
  });

  it("notifies watch subscribers on consecutive iterate clicks with different asset ids", async () => {
    const user = userEvent.setup();

    const MultiHarness: React.FC = () => {
      const defaultValues = Img2ImgSchema.parse({
        model: "nanobanana_pro",
        frameType: "video",
        prompt: "test prompt"
      });
      const methods = useForm<Img2ImgType>({
        defaultValues,
        shouldUnregister: false
      });
      return (
        <FormProvider {...methods}>
          <IterateButton assetId="asset-A" sourceFrame={10} />
          <IterateButton assetId="asset-B" sourceFrame={25} />
          <WatchedIteratedAssetId />
        </FormProvider>
      );
    };

    render(<MultiHarness />);

    const iterateButtons = screen.getAllByRole("button", { name: "Iterate" });
    const watched = screen.getByTestId("watched-asset-id");

    await user.click(iterateButtons[0]);
    expect(watched).toHaveTextContent("asset-A");

    await user.click(iterateButtons[1]);
    expect(watched).toHaveTextContent("asset-B");
  });

  it("is idempotent when clicking iterate twice on the same asset", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();

    render(
      <Harness
        assetId="asset-same"
        sourceFrame={7}
        initialPlayheadFrame={0}
        onValues={onValues}
      />
    );

    const iterateButton = screen.getByRole("button", { name: "Iterate" });

    await user.click(iterateButton);
    await user.click(iterateButton);
    await user.click(screen.getByTestId("read-values"));

    const values = onValues.mock.calls[onValues.mock.calls.length - 1][0];
    expect(values.iteratedAssetId).toBe("asset-same");
    expect(values.iteratedSourceFrame).toBe(7);
    expect(values.frameType).toBe("upload");
  });

  it("clears uploadedImageId when iterating after a manual upload", async () => {
    const user = userEvent.setup();

    const UploadThenIterateHarness: React.FC = () => {
      const defaultValues = Img2ImgSchema.parse({
        model: "nanobanana_pro",
        frameType: "upload",
        prompt: "test prompt",
        uploadedImageId: "uploaded-preexisting"
      });
      const methods = useForm<Img2ImgType>({
        defaultValues,
        shouldUnregister: false
      });
      return (
        <FormProvider {...methods}>
          <IterateButton assetId="asset-iter" sourceFrame={3} />
          <WatchedIteratedAssetId />
          <WatchedUploadedImageId />
        </FormProvider>
      );
    };

    render(<UploadThenIterateHarness />);

    expect(screen.getByTestId("watched-uploaded-id")).toHaveTextContent(
      "uploaded-preexisting"
    );

    await user.click(screen.getByRole("button", { name: "Iterate" }));

    expect(screen.getByTestId("watched-asset-id")).toHaveTextContent(
      "asset-iter"
    );
    expect(screen.getByTestId("watched-uploaded-id")).toHaveTextContent("");
  });

  it("stores iteratedSourceFrame 0 as 0 (not undefined) — frame 0 is a valid index", async () => {
    const user = userEvent.setup();
    const onValues = vi.fn();

    render(
      <Harness
        assetId="asset-789"
        sourceFrame={0}
        initialPlayheadFrame={42}
        onValues={onValues}
      />
    );

    await user.click(screen.getByRole("button", { name: "Iterate" }));
    await user.click(screen.getByTestId("read-values"));

    const values = onValues.mock.calls[onValues.mock.calls.length - 1][0];
    expect(values.iteratedSourceFrame).toBe(0);
  });
});
