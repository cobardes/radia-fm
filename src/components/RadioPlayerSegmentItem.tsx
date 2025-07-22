import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { StationQueueSong, StationQueueTalkSegment } from "@/types/station";
import { fadeVolume } from "@/utils/fade-volume";
import { useContext, useEffect, useRef } from "react";
import Spinner from "./Spinner";

interface RadioPlayerSegmentItemProps {
  item: StationQueueTalkSegment;
  index: number;
  onLoad: (itemId: string) => void;
}

export const SEGMENT_ENDING_OFFSET_SECONDS = 0;

const BACKGROUND_FADE_IN_DURATION_MS = 2000;
const BACKGROUND_FADE_OUT_DURATION_MS = 3000;
const BACKGROUND_FADE_IN_VOLUME = 0.05;

function RadioPlayerSegmentItem({
  item,
  index,
  onLoad,
}: RadioPlayerSegmentItemProps) {
  const { currentItem, currentIndex, playNext, loadedItems, queue } =
    useContext(RadioPlayerContext);
  const finished = useRef(false);
  const backgroundStarted = useRef(false);
  const backgroundFadedOut = useRef(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundRef = useRef<HTMLAudioElement>(null);

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

  const handleAudioLoaded = () => {
    onLoad(item.id);
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

  useEffect(() => {
    if (isActive) {
      // Reset background music state when segment becomes active
      backgroundStarted.current = false;
      backgroundFadedOut.current = false;

      // Start background music immediately if we have a previous song
      if (backgroundRef.current && previousSong) {
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
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = 0.75;
          audioRef.current.play();
        }
      }, 1500);
    }
  }, [isActive, previousSong]);

  useEffect(() => {
    if (currentIndex > index && !finished.current) {
      finished.current = true;
      audioRef.current?.pause();
      backgroundRef.current?.pause();
    }
  }, [currentIndex, index]);

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
              controls={false}
            />
          )}
        </>
      )}
    </div>
  );
}

export default RadioPlayerSegmentItem;
