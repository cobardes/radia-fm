import { RealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { useAudioManager } from "@/hooks/useAudioManager";
import { useMediaSession } from "@/hooks/useMediaSession";
import { StationQueue, StationQueueItem } from "@/types/station";
import { getThumbnailUrl } from "@/utils/get-thumbnail-url";
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
  autoplayBlocked: boolean;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  // Audio manager functions
  audioManager: {
    visualizerData: {
      frequencyData: Uint8Array;
      timeData: Uint8Array;
      averageFrequency: number;
    } | null;
    isSupported: boolean;
    startVisualization: () => void;
    stopVisualization: () => void;
    registerAudioElement: (id: string, audioElement: HTMLAudioElement) => void;
    unregisterAudioElement: (id: string) => void;
    setAudioElementActive: (id: string, isActive: boolean) => void;
    initializeAudioContext: () => void;
    // Loudness normalization functions
    startLoudnessAnalysis: (elementId: string) => void;
    stopLoudnessAnalysis: (elementId: string) => void;
    getLoudnessAnalysis: (elementId: string) => {
      elementId: string;
      rmsPower: number;
      currentDb: number;
      targetDb: number;
      requiredGain: number;
      sampleCount: number;
      isAnalyzing: boolean;
    } | null;
  };
}

export const RadioPlayerContext = createContext<RadioPlayerContextType>({
  queue: [],
  currentIndex: -1,
  currentItem: null,
  loadedItems: new Set(),
  markItemAsLoaded: () => {},
  playNext: () => {},
  handlePlaybackError: () => {},
  autoplayBlocked: false,
  paused: false,
  setPaused: () => {},
  audioManager: {
    visualizerData: null,
    isSupported: false,
    startVisualization: () => {},
    stopVisualization: () => {},
    registerAudioElement: () => {},
    unregisterAudioElement: () => {},
    setAudioElementActive: () => {},
    initializeAudioContext: () => {},
    startLoudnessAnalysis: () => {},
    stopLoudnessAnalysis: () => {},
    getLoudnessAnalysis: () => null,
  },
});

async function canAutoplayAudio() {
  const audio = new Audio();
  audio.src =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="; // silent audio
  audio.muted = false;

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export const useRadioPlayerContextValue = (
  realtimeStation: RealtimeStation
) => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loadedItems, setLoadedItems] = useState<Set<string>>(new Set());
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);

  const { station, extend } = realtimeStation;

  // Initialize centralized audio manager
  const audioManager = useAudioManager({
    fftSize: 512,
    smoothingTimeConstant: 0.3,
  });

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
    canAutoplayAudio().then((allowed) => {
      setAutoplayBlocked(!allowed);

      if (allowed) {
        if (queue.length <= currentIndex + 1) return;
        setCurrentIndex((prev) => prev + 1);
      }
    });
  }, [queue, currentIndex]);

  const handlePlaybackError = useCallback(() => {
    setCurrentIndex((prev) => prev - 1);
  }, []);

  const handlePlay = useCallback(() => {
    setPaused(false);
  }, []);

  const handlePause = useCallback(() => {
    setPaused(true);
  }, []);

  // Set up media session with current item metadata
  const mediaMetadata = useMemo(() => {
    if (!currentItem) return undefined;

    if (currentItem.type === "song") {
      return {
        title: currentItem.title,
        artist: currentItem.artist,
        album: "Radius",
        artwork: [
          {
            src: getThumbnailUrl(currentItem.id),
            sizes: "300x300",
            type: "image/jpeg",
          },
        ],
      };
    } else {
      return {
        title: "Your DJ is talking",
        artist: "Radius",
        artwork: [],
      };
    }
  }, [currentItem]);

  // Use media session hook
  useMediaSession({
    onNextTrack: playNext,
    onPlay: handlePlay,
    onPause: handlePause,
    metadata: mediaMetadata,
  });

  /* Initial playback */
  useEffect(() => {
    if (!isQueueValid) return;

    if (currentIndex === -1) {
      playNext();
    }
  }, [currentIndex, isQueueValid, playNext]);

  useEffect(() => {
    if (currentIndex >= queue.length - 2) {
      extend();
    }
  }, [currentIndex, queue, extend]);

  // Memoize the context value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      queue,
      currentIndex,
      currentItem,
      loadedItems,
      markItemAsLoaded,
      playNext,
      handlePlaybackError,
      autoplayBlocked,
      paused,
      setPaused,
      audioManager,
    }),
    [
      queue,
      currentIndex,
      currentItem,
      loadedItems,
      markItemAsLoaded,
      playNext,
      handlePlaybackError,
      autoplayBlocked,
      paused,
      setPaused,
      audioManager,
    ]
  );
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
