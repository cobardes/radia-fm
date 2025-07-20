import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { QueueItem } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import RadioPlayerSegmentItem from "./RadioPlayerSegmentItem";
import RadioPlayerSongItem from "./RadioPlayerSongItem";

interface RadioPlayerProps {
  queue: QueueItem[];
  onPlaybackReady?: () => void;
}

function RadioPlayer({
  queue,
  onPlaybackReady = () => null,
}: RadioPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loadedItems, setLoadedItems] = useState<Set<string>>(new Set());
  const currentItem = queue[currentIndex];

  const isQueueValid = useMemo(() => {
    return (
      queue.length > 0 &&
      queue[0].type === "segment" &&
      queue[1].type === "song" &&
      loadedItems.has(queue[0].id) &&
      loadedItems.has(queue[1].id)
    );
  }, [queue, loadedItems]);

  const markItemAsLoaded = useCallback((itemId: string) => {
    setLoadedItems((prev) => new Set(prev).add(itemId));
  }, []);

  const playNext = useCallback(() => {
    console.log("playNext called");

    if (queue.length <= currentIndex + 1) return;
    setCurrentIndex((prev) => prev + 1);
  }, [queue, currentIndex]);

  /* Initial playback */
  useEffect(() => {
    if (!isQueueValid) return;

    if (currentIndex === -1) {
      setCurrentIndex(0);
      onPlaybackReady();
    }
  }, [currentIndex, onPlaybackReady, isQueueValid]);

  const handleItemLoad = useCallback(
    (itemId: string) => {
      markItemAsLoaded(itemId);
    },
    [markItemAsLoaded]
  );

  return (
    <RadioPlayerContext.Provider
      value={{
        queue,
        currentIndex,
        currentItem,
        loadedItems,
        markItemAsLoaded,
        playNext,
      }}
    >
      <div className="flex flex-col gap-8">
        {queue.map((item) => {
          switch (item.type) {
            case "song":
              return (
                <RadioPlayerSongItem
                  key={item.id}
                  item={item}
                  onLoad={handleItemLoad}
                />
              );
            case "segment":
              return (
                <RadioPlayerSegmentItem
                  key={item.id}
                  item={item}
                  onLoad={handleItemLoad}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </RadioPlayerContext.Provider>
  );
}

export default RadioPlayer;
