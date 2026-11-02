import { getTrackRenderSettings } from "@domains/track/utils/getTrackRenderSettings";
import { RENDER_MODELS } from "@models/video/constants";
import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { VideoEngine, VideoSettings } from "@models/video/types";
import { Layer } from "@schemas/layer";
import isEqual from "lodash/isEqual";

import { getSettingLabel } from "./getSettingLabel";

const applyFrontendTransform = (
  settings: VideoSettings,
  engine?: VideoEngine
): VideoSettings => {
  const model = RENDER_MODELS.find((m) => m.name === engine);
  if (model?.formatValuesForFrontend) {
    return model.formatValuesForFrontend(settings);
  }
  return settings;
};

const ARRAY_PAIR_LENGTH = 2;

const getModelLabel = (engine?: VideoEngine): string => {
  const model = RENDER_MODELS.find(
    (renderModel) => renderModel.name === engine
  );
  if (!model) {
    return "Unknown model";
  }

  if (!model.displayNameDetails) {
    return model.displayName;
  }

  return `${model.displayName} (${model.displayNameDetails})`;
};

export const getSettingsToDisplay = (
  layers: (Layer | undefined)[],
  assetNamesMap: {
    [assetId: string]: string;
  }
): Array<Array<[string, string | number | boolean]>> => {
  const validLayers = layers.filter(
    (layer): layer is Layer =>
      !!layer && !!layer.data && !!layer.data.renderEngine
  );

  const layersWithSettings = validLayers.filter((layer) => {
    const settings = getTrackRenderSettings(layer);
    return settings && Object.keys(settings).length > 0;
  });

  if (layersWithSettings.length === 0) {
    return layers.map(() => []);
  }

  const definedEngines = layersWithSettings
    .map((layer) => getTrackRenderSettings(layer)?.mago_engine)
    .filter((engine) => engine !== undefined);

  const haveAllLayersSameEngine =
    definedEngines.length === 0 ||
    definedEngines.every((engine) => engine === definedEngines[0]);

  if (!haveAllLayersSameEngine) {
    return layers.map((layer) => {
      if (!layer) return [];
      const settings = getTrackRenderSettings(layer);
      return settings && Object.keys(settings).length > 0
        ? [["Model", getModelLabel(settings?.mago_engine as VideoEngine)]]
        : [];
    });
  }

  const layerSettings = layersWithSettings.map((layer) => {
    const raw = getTrackRenderSettings(layer) || {};
    return applyFrontendTransform(raw, raw.mago_engine as VideoEngine);
  });

  const allKeys = new Set<string>();
  layerSettings.forEach((settings) => {
    Object.keys(settings).forEach((key) => allKeys.add(key));
  });

  const validModelKeys = new Set<string>();

  const firstLayerWithSettings = layersWithSettings[0];
  const engine = getTrackRenderSettings(firstLayerWithSettings)
    ?.mago_engine as VideoEngine;

  const model = RENDER_MODELS.find((model) => model.name === engine);

  const defaultModelSettings = extractDefaultVideoSettings(model);
  const modelSettingKeys = new Set(Object.keys(defaultModelSettings));

  modelSettingKeys.forEach((key) => {
    if (!allKeys.has(key)) return;

    validModelKeys.add(key);
  });

  const differentKeys: string[] = [];

  Array.from(validModelKeys).forEach((key) => {
    if (key === "mago_engine") {
      return;
    }

    const values = layerSettings.map((settings) => settings[key]);
    const firstValue = values[0];

    const hasDifference = values.some((value) => !isEqual(value, firstValue));

    if (hasDifference) {
      differentKeys.push(key);
    }
  });

  return layers.map((layer) => {
    if (!layer) {
      return [];
    }

    const rawSettings = getTrackRenderSettings(layer) || {};

    const hasSettings = layersWithSettings.some(
      (layerWithSettings) => layerWithSettings.id === layer.id
    );
    if (!hasSettings || Object.keys(rawSettings).length === 0) {
      return [];
    }

    const settings = applyFrontendTransform(
      rawSettings,
      rawSettings.mago_engine as VideoEngine
    );
    const engine = settings.mago_engine as VideoEngine;

    const keyValuePairs: Array<[string, string | number | boolean]> = [];

    differentKeys.forEach((key) => {
      const value = settings[key];

      let labelEngine: VideoEngine | string = engine;
      if (!labelEngine) {
        const layerWithEngine = layersWithSettings.find(
          (l) => getTrackRenderSettings(l)?.mago_engine
        );
        labelEngine = layerWithEngine
          ? (getTrackRenderSettings(layerWithEngine)
              ?.mago_engine as VideoEngine) || ""
          : "";
      }

      const label = getSettingLabel(key, labelEngine as VideoEngine);

      let formattedValue: string | number | boolean;
      if (value === null || value === undefined) {
        formattedValue = "n/a";
      } else if (typeof value === "boolean") {
        formattedValue = value ? "Yes" : "No";
      } else if (Array.isArray(value) && value.length === ARRAY_PAIR_LENGTH) {
        const [rangeStart, rangeEnd] = value;
        formattedValue =
          typeof rangeStart === "number" && typeof rangeEnd === "number"
            ? `${rangeStart}-${rangeEnd}`
            : "n/a";
      } else if (key === "mask_mode") {
        if (value === "visual_selection") {
          formattedValue = "Points";
        } else if (value === "prompt_and_visual_selection") {
          formattedValue = "Prompt+Points";
        } else {
          formattedValue = "Prompt";
        }
      } else if (key === "source_image_slot" && assetNamesMap) {
        formattedValue = assetNamesMap[value as string] || (value as string);
      } else {
        formattedValue = value as string | number | boolean;
      }

      keyValuePairs.push([label, formattedValue]);
    });

    return keyValuePairs;
  });
};
