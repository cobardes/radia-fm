import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { SongItem } from "@/types";
import { fadeVolume } from "@/utils/fade-volume";
import Image from "next/image";
import { useContext, useEffect, useRef } from "react";
import { SEGMENT_ENDING_OFFSET_SECONDS } from "./RadioPlayerSegmentItem";

const INITIAL_VOLUME = 0.1;
const TARGET_VOLUME = 0.5;
const FADE_DURATION = 1000;

interface RadioPlayerSongItemProps {
  item: SongItem;
  onLoad: (itemId: string) => void;
}

function RadioPlayerSongItem({ item, onLoad }: RadioPlayerSongItemProps) {
  const { currentItem, playNext, loadedItems } = useContext(RadioPlayerContext);

  const audioRef = useRef<HTMLAudioElement>(null);

  const isActive = currentItem?.id === item.id;

  const handleAudioLoaded = () => {
    onLoad(item.id);
  };

  const handleAudioEnded = () => {
    playNext();
  };

  useEffect(() => {
    if (isActive && audioRef.current) {
      audioRef.current.volume = INITIAL_VOLUME;
      audioRef.current.play();
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
  }, [isActive]);

  return (
    <div>
      {currentItem?.id === item.id && <div className="font-bold">Current</div>}
      <div className="flex items-center gap-2 bg-gray-100">
        <Image
          src={item.thumbnail ?? ""}
          alt={item.title}
          width={40}
          height={40}
          className="rounded-md bg-gray-200"
        />
        <div className="flex flex-col">
          <div className="text-sm font-medium">{item.title}</div>
          <div className="text-sm text-gray-500">{item.artists.join(", ")}</div>
        </div>
      </div>
      <div>can play? {loadedItems.has(item.id) ? "yes" : "no"}</div>
      <audio
        ref={audioRef}
        src={item.audioUrl}
        preload="auto"
        onCanPlay={handleAudioLoaded}
        autoPlay={false}
        onEnded={handleAudioEnded}
        controls={true}
      />
    </div>
  );
}

export default RadioPlayerSongItem;
