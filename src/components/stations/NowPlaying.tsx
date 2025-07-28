"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { StationQueueItem } from "@/types/station";
import PlayerControls from "./PlayerControls";
import { StationVisualizer } from "./StationVisualizer";

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
  const { currentItem, queue, autoplayBlocked, readyToPlay, statusMessage } =
    useRadioPlayer();

  const creatingStation = queue.length === 0;
  const loadingMedia =
    !creatingStation && !readyToPlay && !autoplayBlocked && !currentItem;

  return (
    <div className="w-full h-full">
      <StationVisualizer />
      <div className="absolute inset-0 top-auto flex items-end justify-between p-6 gap-3">
        <div>
          {currentItem && <PlaybackItemInfo item={currentItem} />}
          {queue.length === 0 ? (
            <div className="text text-black/60 animate-pulse">
              {statusMessage}
            </div>
          ) : loadingMedia ? (
            <div className="text text-black/60 animate-pulse">
              Loading tracks
            </div>
          ) : null}
        </div>
        <PlayerControls />
      </div>
    </div>
  );
}
