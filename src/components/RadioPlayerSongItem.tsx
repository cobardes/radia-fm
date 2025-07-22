import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { StationQueueSong } from "@/types/station";
import { fadeVolume } from "@/utils/fade-volume";
import Image from "next/image";
import { useContext, useEffect, useRef } from "react";
import { SEGMENT_ENDING_OFFSET_SECONDS } from "./RadioPlayerSegmentItem";
import Spinner from "./Spinner";

const INITIAL_VOLUME = 0.15;
const TARGET_VOLUME = 0.6;
const FADE_DURATION = 1000;
const SONG_ENDING_OFFSET_SECONDS = 2;

interface RadioPlayerSongItemProps {
  item: StationQueueSong;
  index: number;
  onLoad: (itemId: string) => void;
}

const isPlaying = (audio: HTMLAudioElement) =>
  !!(
    audio.currentTime > 0 &&
    !audio.paused &&
    !audio.ended &&
    audio.readyState > 2
  );

function RadioPlayerSongItem({
  item,
  index,
  onLoad,
}: RadioPlayerSongItemProps) {
  const { currentItem, currentIndex, playNext, loadedItems, queue } =
    useContext(RadioPlayerContext);

  const audioRef = useRef<HTMLAudioElement>(null);
  const finished = useRef(false);

  const isActive = currentItem?.id === item.id;
  const isLoaded = loadedItems.has(item.id);
  const shouldRenderAudio = currentIndex >= index - 2;

  const handleAudioLoaded = () => {
    onLoad(item.id);
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
    if (isActive && audioRef.current && !isPlaying(audioRef.current)) {
      // Reset finished flag when starting a new song
      finished.current = false;

      // Check if the previous queue item is a song
      const previousItem = currentIndex > 0 ? queue[currentIndex - 1] : null;
      const previousItemIsSong = previousItem?.type === "song";

      if (previousItemIsSong) {
        // If previous item was a song, start at target volume immediately
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
    }
  }, [isActive, currentIndex, queue]);

  useEffect(() => {
    if (currentIndex > index && !finished.current) {
      audioRef.current?.pause();
      finished.current = true;
    }
  }, [currentIndex, index]);

  return (
    <div
      className={`flex flex-col gap-2 ${
        currentIndex > index ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Image
          src={`https://wsrv.nl/?url=${encodeURIComponent(
            `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`
          )}&width=300&height=300&fit=cover`}
          alt={item.title}
          width={300}
          height={300}
          className="rounded-md bg-gray-200 w-10"
        />
        <div className="flex flex-col">
          <div
            className={`text-sm font-semibold ${
              isActive ? "text-blue-600" : ""
            }`}
          >
            {item.title}
          </div>
          <div className="text-sm text-gray-500">{item.artist}</div>
        </div>
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
