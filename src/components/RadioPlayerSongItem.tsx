import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { usePauseHandler } from "@/hooks/usePauseHandler";
import { StationQueueSong } from "@/types/station";
import { fadeVolume } from "@/utils/fade-volume";
import { getThumbnailUrl } from "@/utils/get-thumbnail-url";
import Image from "next/image";
import { useContext, useEffect, useRef } from "react";
import { SEGMENT_ENDING_OFFSET_SECONDS } from "./RadioPlayerSegmentItem";
import Spinner from "./Spinner";

const INITIAL_VOLUME = 0.1;
const TARGET_VOLUME = 0.5;
const FADE_DURATION = 1000;
const SONG_ENDING_OFFSET_SECONDS = 1;

interface RadioPlayerSongItemProps {
  item: StationQueueSong;
  index: number;
}

const isPlaying = (audio: HTMLAudioElement) =>
  !!(
    audio.currentTime > 0 &&
    !audio.paused &&
    !audio.ended &&
    audio.readyState > 2
  );

function RadioPlayerSongItem({ item, index }: RadioPlayerSongItemProps) {
  const {
    currentItem,
    currentIndex,
    playNext,
    loadedItems,
    queue,
    markItemAsLoaded,
    audioManager,
    paused,
  } = useContext(RadioPlayerContext);

  const audioRef = useRef<HTMLAudioElement>(null);
  const finished = useRef(false);
  const hasStarted = useRef(false);

  const isActive = currentItem?.id === item.id;
  const isLoaded = loadedItems.has(item.id);
  const shouldRenderAudio =
    currentIndex >= index - 2 && currentIndex < index + 2;

  // Register with centralized audio manager
  useAudioVisualizer({
    audioElementId: `song-${item.id}`,
    audioElement: audioRef.current,
    isActive,
  });

  const handleAudioLoaded = () => {
    markItemAsLoaded(item.id);
  };

  const handleAudioProgress = (
    event: React.SyntheticEvent<HTMLAudioElement>
  ) => {
    if (finished.current) return;

    const audio = event.target as HTMLAudioElement;

    if (audio.currentTime >= audio.duration - SONG_ENDING_OFFSET_SECONDS) {
      finished.current = true;
      playNext();
    }
  };

  useEffect(() => {
    if (
      isActive &&
      audioRef.current &&
      !isPlaying(audioRef.current) &&
      !paused
    ) {
      // Reset finished flag when starting a new song
      finished.current = false;

      // Check if the previous queue item is a song
      const previousItem = currentIndex > 0 ? queue[currentIndex - 1] : null;
      const previousItemIsSong = previousItem?.type === "song";

      // Skip fade-in if this is a resume or if previous item was a song
      const shouldSkipFadeIn = hasStarted.current || previousItemIsSong;

      if (shouldSkipFadeIn) {
        // Start at target volume immediately (resume or previous was song)
        audioRef.current.volume = TARGET_VOLUME;
      } else {
        // If previous item was a segment (or no previous item), fade in
        audioRef.current.volume = INITIAL_VOLUME;
        setTimeout(() => {
          if (audioRef.current) {
            fadeVolume(
              audioRef.current,
              INITIAL_VOLUME,
              TARGET_VOLUME,
              FADE_DURATION
            );
          }
        }, SEGMENT_ENDING_OFFSET_SECONDS * 1000);
      }

      audioRef.current.play();

      // Mark that this song has started
      hasStarted.current = true;

      // Start centralized visualization
      audioManager.startVisualization();
    }
  }, [isActive, currentIndex, queue, audioManager, paused]);

  useEffect(() => {
    if (currentIndex > index && !finished.current) {
      audioRef.current?.pause();
      finished.current = true;
    }
  }, [currentIndex, index]);

  // Reset hasStarted flag when this item becomes active (new song)
  useEffect(() => {
    if (isActive) {
      hasStarted.current = false;
    }
  }, [isActive, item.id]);

  usePauseHandler(audioRef, isActive);

  return (
    <div
      className={`flex flex-col gap-2 ${
        currentIndex > index ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Image
          src={getThumbnailUrl(item.id)}
          alt={item.title}
          width={300}
          height={300}
          className="rounded-md bg-gray-200 w-10"
        />
        <div className="flex flex-col flex-1">
          <div
            className={`text-sm font-semibold ${
              isActive ? "text-blue-600" : ""
            }`}
          >
            {item.title}
          </div>
          <div className="text-sm text-gray-500">{item.artist}</div>
        </div>

        <div>{item.reason}</div>

        {/* Simple loading indicator */}
        {!isLoaded && shouldRenderAudio && <Spinner color="#666" size={20} />}
      </div>

      {shouldRenderAudio && (
        <audio
          ref={audioRef}
          src={item.audioUrl}
          preload="auto"
          onCanPlay={handleAudioLoaded}
          onTimeUpdate={handleAudioProgress}
          autoPlay={false}
          controls={true}
        />
      )}
    </div>
  );
}

export default RadioPlayerSongItem;
