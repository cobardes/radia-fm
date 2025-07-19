import { QueueItem } from "@/types";
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
  queue: QueueItem[];
  currentIndex: number;
  currentItem: QueueItem | null;
  loadedItems: Set<string>;
  markItemAsLoaded: (itemId: string) => void;
  playNext: () => void;
}
