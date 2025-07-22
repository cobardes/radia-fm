import { RealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { StationQueue, StationQueueItem } from "@/types/station";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface RadioPlayerContextType {
  queue: StationQueue;
  currentIndex: number;
  currentItem: StationQueueItem | null;
  loadedItems: Set<string>;
  markItemAsLoaded: (itemId: string) => void;
  playNext: () => void;
  handlePlaybackError: () => void;
}

export const RadioPlayerContext = createContext<RadioPlayerContextType>({
  queue: [],
  currentIndex: -1,
  currentItem: null,
  loadedItems: new Set(),
  markItemAsLoaded: () => {},
  playNext: () => {},
  handlePlaybackError: () => {},
});

async function canAutoplayAudio() {
  const audio = new Audio();
  audio.src =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="; // silent audio
  audio.muted = true;

  try {
    await audio.play();
    return true;
  } catch (err) {
    return false;
  }
}

export const useRadioPlayerContextValue = (
  realtimeStation: RealtimeStation
) => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loadedItems, setLoadedItems] = useState<Set<string>>(new Set());
  const [autoplayAllowed, setAutoplayAllowed] = useState<boolean>(false);

  const { station, extend } = realtimeStation;

  const queue = station?.queue ?? [];
  const currentItem = queue[currentIndex];

  const isQueueValid = useMemo(() => {
    return (
      queue.length > 0 &&
      queue[0].type === "talk" &&
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

  const handlePlaybackError = useCallback(() => {
    setCurrentIndex((prev) => prev - 1);
  }, []);

  /* Initial playback */
  useEffect(() => {
    if (!isQueueValid) return;

    if (currentIndex === -1) {
      /* Do not autoplay if the user has not interacted with the page */
      canAutoplayAudio().then((allowed) => {
        console.log("autoplay allowed", allowed);
        setAutoplayAllowed(allowed);
        if (allowed) playNext();
      });
    }
  }, [currentIndex, isQueueValid, playNext]);

  useEffect(() => {
    if (currentIndex >= queue.length - 2) {
      extend();
    }
  }, [currentIndex, queue, extend]);

  return {
    queue,
    currentIndex,
    currentItem,
    loadedItems,
    markItemAsLoaded,
    playNext,
    handlePlaybackError,
    autoplayAllowed,
  };
};

export const useRadioPlayer = () => {
  const context = useContext(RadioPlayerContext);
  if (!context) {
    throw new Error(
      "useRadioPlayer must be used within a RadioPlayerContextProvider"
    );
  }
  return context;
};
