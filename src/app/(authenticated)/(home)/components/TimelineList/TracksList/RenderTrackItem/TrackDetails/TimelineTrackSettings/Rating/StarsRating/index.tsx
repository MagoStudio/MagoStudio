import { Icon } from "@components/Icon";
import { RatingType } from "@domains/track/interface";
import { useUpdateTrack } from "@domains/track/useUpdateTrack";
import { trackingUtils } from "@hooks/tracking/trackingUtils";
import { Layer } from "@schemas/layer";
import React, { useState } from "react";

interface StarsRatingProps {
  track: Layer;
}

const RATING_OPTIONS = [
  RatingType.ONE_STAR,
  RatingType.TWO_STARS,
  RatingType.THREE_STARS
];

export const StarsRating: React.FC<StarsRatingProps> = ({ track }) => {
  const [localRating, setLocalRating] = useState(track.rating ?? 0);
  const { mutateAsync: updateTrack } = useUpdateTrack();

  const handleStarClick = async (starIndex: number) => {
    const newRating = localRating === starIndex ? 0 : starIndex;

    try {
      await updateTrack({
        layerId: track.id,
        layerName: track.name,
        layerData: track.data,
        rating: newRating
      });
      setLocalRating(newRating);

      trackingUtils.trackActions.starButton(
        getRatingTypeFromNumber(newRating),
        track.id
      );
    } catch (error) {
      console.error("Error updating layer:", error);
      setLocalRating(localRating);
    }
  };

  return (
    <div className="flex items-center pointer-events-auto">
      {RATING_OPTIONS.map((value) => (
        <button
          key={value}
          type="button"
          className="bg-none border-none"
          onClick={() => handleStarClick(value)}
          aria-label={`star rating ${getRatingTypeFromNumber(value)}`}
        >
          <Icon
            iconSet="16-filled"
            iconName="rating"
            className={`p-[2px] ${value <= localRating ? "text-element-in-progress" : "text-glyph-tertiary"}`}
          />
        </button>
      ))}
    </div>
  );
};

function getRatingTypeFromNumber(rating: RatingType): string {
  switch (rating) {
    case RatingType.ONE_STAR:
      return "ONE_STAR";
    case RatingType.TWO_STARS:
      return "TWO_STARS";
    case RatingType.THREE_STARS:
      return "THREE_STARS";
  }
  return "NO_RATING";
}
