"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { StationQueueItem } from "@/types/station";
import { extractDominantColors } from "@/utils/extract-dominant-colors";
import { getThumbnailUrl } from "@/utils/get-thumbnail-url";
import { MaterialSymbol } from "material-symbols";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SphereVisualizer } from "../visualizers/SphereVisualizer";

// Audio-responsive scale animation constants
const SCALE_CONFIG = {
  MIN_SCALE: 0.4, // Minimum scale when audio is quiet
  MAX_SCALE: 1.2, // Maximum scale when audio is loud
  SMOOTHING_FACTOR: 0.1, // How quickly scale responds to changes (0-1, lower = smoother)
  DEFAULT_FREQUENCY: 50, // Fallback frequency when no audio data
} as const;

function ControlButton({
  icon,
  iconPosition = "left",
  label,
  onClick,
}: {
  icon: MaterialSymbol;
  iconPosition?: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`bg-white text-black py-2 px-4 cursor-pointer rounded-full uppercase font-mono font-semibold tracking-wide text-sm flex items-center gap-2 active:bg-black active:text-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-neutral-400 ${
        iconPosition === "left" ? "pl-2.5" : "pr-2.5"
      }`}
      onClick={onClick}
    >
      {iconPosition === "left" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
      <span>{label}</span>
      {iconPosition === "right" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
    </button>
  );
}

function PlaybackItemInfo({ item }: { item: StationQueueItem }) {
  if (item.type === "talk") {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="text-sm text-black/60">{item.artist}</div>
      <div className="flex items-center gap-2">
        <div className="text font-medium">{item.title}</div>
        <span className="material-symbols-outlined text-xl! font-medium!">
          info
        </span>
      </div>
    </div>
  );
}

export default function NowPlaying() {
  const { currentItem, playNext, paused, setPaused } = useRadioPlayer();
  const { audioManager } = useRadioPlayer();

  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [smoothedScale, setSmoothedScale] = useState<number>(1);

  const speed = (audioManager.visualizerData?.averageFrequency ?? 1) / 255;

  // Smooth the scale based on audio intensity
  useEffect(() => {
    const currentFrequency =
      audioManager.visualizerData?.averageFrequency ??
      SCALE_CONFIG.DEFAULT_FREQUENCY;
    const scaleRange = SCALE_CONFIG.MAX_SCALE - SCALE_CONFIG.MIN_SCALE;
    const targetScale =
      SCALE_CONFIG.MIN_SCALE + (currentFrequency / 255) * scaleRange;

    setSmoothedScale((prev) => {
      // Exponential smoothing for smoother transitions
      return prev + (targetScale - prev) * SCALE_CONFIG.SMOOTHING_FACTOR;
    });
  }, [audioManager.visualizerData?.averageFrequency]);

  useEffect(() => {
    if (currentItem && currentItem.type === "song") {
      extractDominantColors(getThumbnailUrl(currentItem.id)).then(
        setDominantColors
      );
    } else {
      setDominantColors(["#000", "#111", "#222", "#111", "#000"]);
    }
  }, [currentItem]);

  if (!currentItem) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <ControlButton
          icon="play_circle"
          label="Escuchar"
          onClick={playNext}
          iconPosition="right"
        />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <div className="absolute left-0 top-0 p-3.5 px-4.5">
        <Link href="/" className="font-mono font-semibold tracking-tight">
          <span>
            rad(ia){" "}
            <span className="text-xs text-black/60 font-normal">
              de cobardes.org
            </span>
          </span>
        </Link>
      </div>
      <div className="absolute inset-0 top-auto flex items-end justify-between p-6 gap-3">
        <div>
          <PlaybackItemInfo item={currentItem} />
        </div>
        <div className="flex gap-3">
          <ControlButton
            icon={paused ? "play_circle" : "pause_circle"}
            label={paused ? "Reanudar" : "Pausar"}
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
            label="Saltar"
            iconPosition="right"
            onClick={playNext}
          />
        </div>
      </div>
      <div className="w-full h-full flex flex-col gap-6 items-center justify-center">
        <SphereVisualizer
          colors={dominantColors}
          speed={speed}
          scale={smoothedScale}
        />
      </div>
    </div>
  );
}
