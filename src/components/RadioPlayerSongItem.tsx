import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { SongItem } from "@/types";
import { fadeVolume } from "@/utils/fade-volume";
import Image from "next/image";
import { useContext, useEffect, useRef } from "react";
import { SEGMENT_ENDING_OFFSET_SECONDS } from "./RadioPlayerSegmentItem";
import Spinner from "./Spinner";

const INITIAL_VOLUME = 0.075;
const TARGET_VOLUME = 0.5;
const FADE_DURATION = 1000;

interface RadioPlayerSongItemProps {
  item: SongItem;
  index: number;
  onLoad: (itemId: string) => void;
}

function RadioPlayerSongItem({
  item,
  index,
  onLoad,
}: RadioPlayerSongItemProps) {
  const { currentItem, currentIndex, playNext, loadedItems, queue } =
    useContext(RadioPlayerContext);

  const audioRef = useRef<HTMLAudioElement>(null);

  const isActive = currentItem?.id === item.id;
  const isLoaded = loadedItems.has(item.id);
  const shouldRenderAudio = currentIndex >= index - 2;

  const handleAudioLoaded = () => {
    onLoad(item.id);
  };

  const handleAudioEnded = () => {
    playNext();
  };

  useEffect(() => {
    if (isActive && audioRef.current) {
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Image
          src={item.thumbnail ?? ""}
          alt={item.title}
          width={40}
          height={40}
          className="rounded-md bg-gray-200"
        />
        <div className="flex flex-col">
          <div
            className={`text-sm font-semibold ${
              isActive ? "text-blue-600" : ""
            }`}
          >
            {item.title}
          </div>
          <div className="text-sm text-gray-500">{item.artists.join(", ")}</div>
        </div>
        {!isLoaded && <Spinner color="#000" size={20} />}
      </div>
      {shouldRenderAudio && (
        <audio
          ref={audioRef}
          src={item.audioUrl}
          preload="auto"
          onCanPlay={handleAudioLoaded}
          autoPlay={false}
          onEnded={handleAudioEnded}
          controls={true}
        />
      )}
    </div>
  );
}

export default RadioPlayerSongItem;
