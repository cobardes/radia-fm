import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { extractDominantColors } from "@/utils/extract-dominant-colors";
import { getThumbnailUrl } from "@/utils/get-thumbnail-url";
import { useEffect, useState } from "react";
import {
  SphereVisualizer,
  SphereVisualizerColors,
} from "../visualizers/SphereVisualizer";

const MIN_SCALE = 0; // Minimum scale when audio is quiet
const MAX_SCALE = 1.6; // Maximum scale when audio is loud
const SMOOTHING_FACTOR = 1; // How quickly scale responds to changes (0-1, lower = smoother)
const DEFAULT_FREQUENCY = 0; // Fallback frequency when no audio data

const DEFAULT_COLORS: SphereVisualizerColors = [
  "#333",
  "#777",
  "#444",
  "#666",
  "#555",
  "#888",
  "#222",
  "#999",
];

export function StationVisualizer() {
  const {
    currentItem,
    queue,
    paused,
    autoplayBlocked,
    playbackStarted,
    readyToPlay,
  } = useRadioPlayer();
  const { audioManager } = useRadioPlayer();

  const [dominantColors, setDominantColors] =
    useState<SphereVisualizerColors>(DEFAULT_COLORS);
  const [smoothedScale, setSmoothedScale] = useState<number>(0.7);

  const speed =
    (audioManager.visualizerData?.averageFrequency ?? 0) / 255 + 0.2;

  const creatingStation = queue.length === 0;
  const loadingMedia =
    !creatingStation && !readyToPlay && !autoplayBlocked && !currentItem;

  const goBlack = !currentItem || currentItem.type === "talk";

  const busy = creatingStation || loadingMedia;

  // Smooth the scale based on audio intensity
  useEffect(() => {
    // Don't update scale when paused - freeze it at current value
    if (paused || !playbackStarted) {
      return;
    }

    const currentFrequency =
      (audioManager.visualizerData?.averageFrequency ?? DEFAULT_FREQUENCY) /
      255;

    // Calculate target scale for main sphere
    const scaleRange = MAX_SCALE - MIN_SCALE;
    const targetScale = MIN_SCALE + currentFrequency * scaleRange;

    // Update main sphere scale
    setSmoothedScale((prev) => {
      // Exponential smoothing for smoother transitions
      return prev + (targetScale - prev) * SMOOTHING_FACTOR;
    });
  }, [audioManager.visualizerData?.averageFrequency, paused]);

  useEffect(() => {
    if (currentItem && currentItem.type === "song") {
      extractDominantColors(getThumbnailUrl(currentItem.id)).then(
        setDominantColors
      );
    } else {
      setDominantColors(DEFAULT_COLORS);
    }
  }, [currentItem]);

  return (
    <div
      id="sphere-container"
      className={`w-full h-full flex flex-col gap-6 items-center justify-center relative -z-10 transition-all duration-200  ${
        paused ? "opacity-50 " : ""
      } ${busy ? "animate-soft-pulse" : ""}`}
    >
      <div className="cursor-pointer">
        <SphereVisualizer
          colors={dominantColors}
          speed={speed}
          scale={smoothedScale}
          goBlack={goBlack}
        />
        <div
          id="background-sphere"
          className="absolute inset-0 flex items-center justify-center blur-2xl -z-20 transition-opacity duration-200"
          style={{
            opacity: goBlack ? 0 : 1,
          }}
        >
          <SphereVisualizer
            colors={dominantColors}
            speed={speed}
            scale={Math.max(smoothedScale, 0.5)}
            goBlack={goBlack}
          />
        </div>
      </div>
    </div>
  );
}
