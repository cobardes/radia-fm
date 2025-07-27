"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { StationQueueItem } from "@/types/station";
import { extractDominantColors } from "@/utils/extract-dominant-colors";
import { getThumbnailUrl } from "@/utils/get-thumbnail-url";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ControlButton } from "./ControlButton";
import { StationVisualizer } from "./StationVisualizer";

// Audio-responsive scale animation constants
const SCALE_CONFIG = {
  MIN_SCALE: 0.3, // Minimum scale when audio is quiet
  MAX_SCALE: 1.6, // Maximum scale when audio is loud
  SMOOTHING_FACTOR: 1, // How quickly scale responds to changes (0-1, lower = smoother)
  DEFAULT_FREQUENCY: 0, // Fallback frequency when no audio data
} as const;

function PlaybackItemInfo({ item }: { item: StationQueueItem }) {
  if (item.type === "talk") {
    return <div className="flex flex-col font-medium">DJ Commentary</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="text-sm text-black/60">{item.artist}</div>
      <div className="text font-medium">{item.title}</div>
    </div>
  );
}

export default function NowPlaying() {
  const {
    currentItem,
    queue,
    playNext,
    paused,
    setPaused,
    setAutoplayBlocked,
    autoplayBlocked,
    playbackStarted,
    readyToPlay,
    statusMessage,
  } = useRadioPlayer();
  const { audioManager } = useRadioPlayer();

  const [dominantColors, setDominantColors] = useState<
    [string, string, string, string, string, string, string, string]
  >(["#000", "#000", "#000", "#000", "#000", "#000", "#000", "#000"]);
  const [smoothedScale, setSmoothedScale] = useState<number>(0.7);

  const speed =
    (audioManager.visualizerData?.averageFrequency ?? 0) / 255 + 0.2;

  // Smooth the scale based on audio intensity
  useEffect(() => {
    // Don't update scale when paused - freeze it at current value
    if (paused || !playbackStarted) {
      return;
    }

    const currentFrequency =
      (audioManager.visualizerData?.averageFrequency ??
        SCALE_CONFIG.DEFAULT_FREQUENCY) / 255;

    // Calculate target scale for main sphere
    const scaleRange = SCALE_CONFIG.MAX_SCALE - SCALE_CONFIG.MIN_SCALE;
    const targetScale = SCALE_CONFIG.MIN_SCALE + currentFrequency * scaleRange;

    // Update main sphere scale
    setSmoothedScale((prev) => {
      // Exponential smoothing for smoother transitions
      return prev + (targetScale - prev) * SCALE_CONFIG.SMOOTHING_FACTOR;
    });
  }, [audioManager.visualizerData?.averageFrequency, paused]);

  useEffect(() => {
    if (currentItem && currentItem.type === "song") {
      extractDominantColors(getThumbnailUrl(currentItem.id)).then(
        setDominantColors
      );
    } else {
      setDominantColors([
        "#333",
        "#777",
        "#444",
        "#666",
        "#555",
        "#888",
        "#222",
        "#999",
      ]);
    }
  }, [currentItem]);

  const creatingStation = queue.length === 0;
  const loadingMedia =
    !creatingStation && !readyToPlay && !autoplayBlocked && !currentItem;
  const goBlack = !currentItem || currentItem.type === "talk";

  const busy = creatingStation || loadingMedia;

  return (
    <div className="w-screen h-screen">
      <div className="absolute left-0 top-0 p-3.5 px-4.5">
        <Link href="/" className="font-mono font-semibold tracking-tight">
          <span>
            rad(ia){" "}
            <span className="text-xs text-black/60 font-normal">
              experimental
            </span>
          </span>
        </Link>
      </div>
      <div className="absolute inset-0 top-auto flex items-end justify-between p-6 gap-3">
        <div>
          {currentItem && <PlaybackItemInfo item={currentItem} />}
          {queue.length === 0 ? (
            <div className="text-sm text-black/60 animate-pulse">
              {statusMessage}
            </div>
          ) : loadingMedia ? (
            <div className="text-sm text-black/60 animate-pulse">
              Loading tracks
            </div>
          ) : null}
        </div>
        <div className="flex gap-3">
          {!creatingStation &&
            (autoplayBlocked ? (
              <ControlButton
                icon="play_circle"
                label="Play this station"
                onClick={() => {
                  setAutoplayBlocked(false);
                }}
                iconPosition="right"
              />
            ) : (
              currentItem && (
                <>
                  <ControlButton
                    icon={paused ? "play_circle" : "pause_circle"}
                    label={paused ? "Resume" : "Pause"}
                    onClick={() => {
                      if (paused) {
                        setPaused(false);
                      } else {
                        setPaused(true);
                      }
                    }}
                  />
                  <ControlButton
                    icon="arrow_circle_right"
                    label="Skip"
                    iconPosition="right"
                    onClick={playNext}
                  />
                </>
              )
            ))}
        </div>
      </div>
      <StationVisualizer />
    </div>
  );
}
