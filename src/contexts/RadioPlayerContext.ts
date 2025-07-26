import { RealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { useAudioManager } from "@/hooks/useAudioManager";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useMediaSession } from "@/hooks/useMediaSession";
import { StationQueue, StationQueueItem } from "@/types/station";
import { debounce } from "@/utils";
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
  readyToPlay: boolean;
  loadedItems: Set<string>;
  markItemAsLoaded: (itemId: string) => void;
  playNext: () => void;
  handlePlaybackError: () => void;
  autoplayBlocked: boolean;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  setAutoplayBlocked: (blocked: boolean) => void;
  isCreator: boolean;
  playbackStarted: boolean;
  setPlaybackStarted: (started: boolean) => void;
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
  readyToPlay: false,
  loadedItems: new Set(),
  markItemAsLoaded: () => {},
  playNext: () => {},
  handlePlaybackError: () => {},
  autoplayBlocked: false,
  paused: false,
  setPaused: () => {},
  setAutoplayBlocked: () => {},
  isCreator: false,
  playbackStarted: false,
  setPlaybackStarted: () => {},
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
  const { user } = useFirebaseAuth();

  const [initialIndex, setInitialIndex] = useState<number | undefined>(
    undefined
  );

  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [loadedItems, setLoadedItems] = useState<Set<string>>(new Set());
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [playbackStarted, setPlaybackStarted] = useState<boolean>(false);

  const { station, extend } = realtimeStation;

  // Determine if current user is the creator
  const isCreator = Boolean(user && station && station.creatorId === user.uid);

  // Initialize currentIndex from station data once
  useEffect(() => {
    if (station && station.currentIndex !== undefined) {
      setInitialIndex(station.currentIndex);
      setCurrentIndex(station.currentIndex);
    }
  }, [station?.id]); // Only run when station changes, not on every station update

  // Debounced function to sync currentIndex to server
  const syncCurrentIndex = useCallback(
    debounce(async (newIndex: number) => {
      if (!isCreator || !station || !user) return;

      try {
        const token = await user.getIdToken();
        await fetch(`/api/stations/${station.id}/playback`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentIndex: newIndex }),
        });
      } catch (error) {
        console.error("Failed to sync currentIndex:", error);
      }
    }, 1000), // Debounce by 1 second
    [isCreator, station, user]
  );

  // Initialize centralized audio manager
  const audioManager = useAudioManager({
    fftSize: 512,
    smoothingTimeConstant: 0.3,
  });

  const queue = station?.queue ?? [];
  const currentItem = queue[currentIndex];

  const readyToPlay = useMemo(() => {
    if (queue.length === 0 || initialIndex === undefined) return false;

    if (initialIndex === -1) {
      const item0 = queue[0];
      const item1 = queue[1];

      const item0Loaded = item0 ? loadedItems.has(item0.id) : false;
      const item1Loaded = item1 ? loadedItems.has(item1.id) : false;

      return item0Loaded && item1Loaded;
    } else {
      const firstItem = queue[initialIndex];
      const secondItem = queue[initialIndex + 1];

      const firstLoaded = firstItem ? loadedItems.has(firstItem.id) : false;
      const secondLoaded = secondItem ? loadedItems.has(secondItem.id) : false;

      return firstLoaded && secondLoaded;
    }
  }, [queue, currentIndex, loadedItems, initialIndex]);

  const markItemAsLoaded = useCallback((itemId: string) => {
    setLoadedItems((prev) => new Set(prev).add(itemId));
  }, []);

  const playNext = useCallback(() => {
    if (autoplayBlocked) return;
    if (queue.length <= currentIndex + 1) return;

    const newIndex = currentIndex + 1;

    // Always update local state first
    setCurrentIndex(newIndex);

    // If creator, also sync to server
    if (isCreator) {
      syncCurrentIndex(newIndex);
    }
  }, [queue, currentIndex, isCreator, syncCurrentIndex, autoplayBlocked]);

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
        album: "Radia",
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
        artist: "Radia",
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
    if (readyToPlay && currentIndex === -1) {
      playNext();
    }
  }, [currentIndex, readyToPlay, playNext]);

  useEffect(() => {
    if (currentIndex >= queue.length - 2) {
      extend();
    }
  }, [currentIndex, queue, extend]);

  useEffect(() => {
    canAutoplayAudio().then((allowed) => {
      setAutoplayBlocked(!allowed);
    });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      queue,
      currentIndex,
      currentItem,
      readyToPlay,
      loadedItems,
      markItemAsLoaded,
      playNext,
      handlePlaybackError,
      autoplayBlocked,
      paused,
      setPaused,
      setAutoplayBlocked,
      isCreator,
      audioManager,
      playbackStarted,
      setPlaybackStarted,
    }),
    [
      queue,
      currentIndex,
      currentItem,
      readyToPlay,
      loadedItems,
      markItemAsLoaded,
      playNext,
      handlePlaybackError,
      autoplayBlocked,
      setAutoplayBlocked,
      paused,
      setPaused,
      isCreator,
      audioManager,
      playbackStarted,
      setPlaybackStarted,
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
