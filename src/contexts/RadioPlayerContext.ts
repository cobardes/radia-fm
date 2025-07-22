import { StationQueue, StationQueueItem } from "@/types/station";
import { createContext } from "react";

export const RadioPlayerContext = createContext<RadioPlayerContextType>({
  queue: [],
  currentIndex: -1,
  currentItem: null,
  loadedItems: new Set(),
  markItemAsLoaded: () => {},
  playNext: () => {},
});

interface RadioPlayerContextType {
  queue: StationQueue;
  currentIndex: number;
  currentItem: StationQueueItem | null;
  loadedItems: Set<string>;
  markItemAsLoaded: (itemId: string) => void;
  playNext: () => void;
}
