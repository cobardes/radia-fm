import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { usePauseHandler } from "@/hooks/usePauseHandler";
import { StationQueueSong, StationQueueTalkSegment } from "@/types/station";
import { fadeVolume } from "@/utils/fade-volume";
import { useContext, useEffect, useRef } from "react";
import Spinner from "./Spinner";

interface RadioPlayerSegmentItemProps {
  item: StationQueueTalkSegment;
  index: number;
}

export const SEGMENT_ENDING_OFFSET_SECONDS = 1.5;

const BACKGROUND_FADE_IN_DURATION_MS = 2000;
const BACKGROUND_FADE_OUT_DURATION_MS = 3000;
const BACKGROUND_FADE_IN_VOLUME = 0.075;

function RadioPlayerSegmentItem({ item, index }: RadioPlayerSegmentItemProps) {
  const {
    currentItem,
    currentIndex,
    playNext,
    loadedItems,
    queue,
    markItemAsLoaded,
    paused,
    audioManager,
  } = useContext(RadioPlayerContext);
  const finished = useRef(false);
  const backgroundStarted = useRef(false);
  const backgroundFadedOut = useRef(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundRef = useRef<HTMLAudioElement>(null);

  const mainAudioTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = currentItem?.id === item.id;
  const isLoaded = loadedItems.has(item.id);
  const shouldRenderAudio = currentIndex >= index - 2;

  // Find the closest previous song in the queue
  const previousSong = (() => {
    for (let i = index - 1; i >= 0; i--) {
      const queueItem = queue[i];
      if (queueItem?.type === "song") {
        return queueItem as StationQueueSong;
      }
    }
    return null;
  })();

  // Register main audio with centralized manager
  useAudioVisualizer({
    audioElementId: `segment-main-${item.id}`,
    audioElement: audioRef.current,
    isActive: isActive && !paused,
  });

  const handleAudioLoaded = () => {
    markItemAsLoaded(item.id);
  };

  const handleAudioProgress = (
    event: React.SyntheticEvent<HTMLAudioElement>
  ) => {
    if (finished.current) return;

    const audio = event.target as HTMLAudioElement;
    const timeRemaining = audio.duration - audio.currentTime;

    // Fade out background music 3 seconds before segment ends (3 seconds before SEGMENT_ENDING_OFFSET_SECONDS)
    if (
      !backgroundFadedOut.current &&
      timeRemaining <= 3 &&
      backgroundRef.current &&
      backgroundStarted.current
    ) {
      backgroundFadedOut.current = true;

      // Fade out to 0 over 3 seconds, then stop
      fadeVolume(
        backgroundRef.current,
        backgroundRef.current.volume,
        0,
        BACKGROUND_FADE_OUT_DURATION_MS
      );
      setTimeout(() => {
        if (backgroundRef.current) {
          backgroundRef.current.pause();
        }
      }, BACKGROUND_FADE_OUT_DURATION_MS);
    }

    if (audio.currentTime >= audio.duration - SEGMENT_ENDING_OFFSET_SECONDS) {
      finished.current = true;
      playNext();
    }
  };

  // Start visualization for mixed audio
  useEffect(() => {
    if (isActive && !paused) {
      audioManager.startVisualization();
    }
  }, [isActive, paused, audioManager]);

  // Start background music
  useEffect(() => {
    if (isActive && !paused) {
      // Reset background music state when segment becomes active
      backgroundStarted.current = false;
      backgroundFadedOut.current = false;

      // Start background music immediately if we have a previous song
      if (backgroundRef.current && previousSong && !backgroundStarted.current) {
        backgroundStarted.current = true;

        // Set initial volume to 0
        backgroundRef.current.volume = 0;

        // Start from 33% of the track duration
        const startPosition = backgroundRef.current.duration * 0.33;
        backgroundRef.current.currentTime = startPosition;

        // Start playing
        backgroundRef.current.play();

        // Fade in from 0 to 0.05 over 2 seconds
        fadeVolume(
          backgroundRef.current,
          0,
          BACKGROUND_FADE_IN_VOLUME,
          BACKGROUND_FADE_IN_DURATION_MS
        );
      }

      // Start the main audio (talk segment) after 1 second delay
      mainAudioTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = 1;
          console.log("playing main audio (delay)");
          audioRef.current.play();
        }
      }, 1500);
    }

    return () => {
      if (mainAudioTimeoutRef.current) {
        clearTimeout(mainAudioTimeoutRef.current);
      }
    };
  }, [isActive, previousSong, paused]);

  // Pause the audio when the segment is no longer active
  useEffect(() => {
    if (currentIndex > index && !finished.current) {
      finished.current = true;
      audioRef.current?.pause();
      backgroundRef.current?.pause();
      if (mainAudioTimeoutRef.current) {
        clearTimeout(mainAudioTimeoutRef.current);
      }
    }
  }, [currentIndex, index]);

  // Pause the audio when the segment is paused
  // useEffect(() => {
  //   if (paused && isActive) {
  //     audioRef.current?.pause();
  //     backgroundRef.current?.pause();
  //   } else if (!paused && isActive) {
  //     console.log("playing main audio (unpaused)");
  //     audioRef.current?.play();
  //     backgroundRef.current?.play();
  //   }
  // }, [paused, isActive]);

  usePauseHandler(audioRef, isActive);
  usePauseHandler(backgroundRef, isActive);

  return (
    <div
      className={`flex flex-col gap-2 ${
        currentIndex > index ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`text-sm font-medium ${isActive ? "text-blue-600" : ""}`}
        >
          {item.text}
        </div>
        {!isLoaded && shouldRenderAudio && <Spinner color="#666" size={20} />}
      </div>
      {shouldRenderAudio && (
        <>
          <audio
            ref={audioRef}
            src={item.audioUrl}
            onCanPlay={handleAudioLoaded}
            onCanPlayThrough={handleAudioLoaded}
            onTimeUpdate={handleAudioProgress}
            autoPlay={false}
            controls={true}
          />
          {previousSong && (
            <audio
              ref={backgroundRef}
              src={previousSong.audioUrl}
              preload="auto"
              autoPlay={false}
              controls={true}
            />
          )}
        </>
      )}
    </div>
  );
}

export default RadioPlayerSegmentItem;
