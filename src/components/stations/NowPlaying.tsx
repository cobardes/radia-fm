"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { StationQueueItem } from "@/types/station";
import Link from "next/link";
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
        <PlayerControls />
      </div>
      <StationVisualizer />
    </div>
  );
}
