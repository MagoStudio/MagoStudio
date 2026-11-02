import { SourceImage, SourceImageType } from "@domains/renders/types";
import { VideoEngine } from "@models/video/types";
import { getVideoModelByEngine } from "@models/video/utils/getVideoModelByEngine";

const pickPrimaryStyleImage = (
  sources: SourceImage[]
): SourceImage | undefined =>
  sources.find((entry) => entry.type === "key_frame") ?? sources[0];

const toWireSource = (
  primary: SourceImage,
  role: SourceImageType
): SourceImage =>
  role === "key_frame"
    ? { asset_id: primary.asset_id, type: role, index: primary.index ?? 0 }
    : { asset_id: primary.asset_id, type: role };

export const buildMagoImageSources = (
  engine: VideoEngine | string | undefined,
  sources: SourceImage[]
): SourceImage[] => {
  const declaredWireRoles =
    getVideoModelByEngine(engine)?.capabilities.wireSourceRoles ?? [];
  if (declaredWireRoles.length === 0) return sources;

  const primary = pickPrimaryStyleImage(sources);
  if (!primary) return [];

  return declaredWireRoles.map((role) => toWireSource(primary, role));
};
