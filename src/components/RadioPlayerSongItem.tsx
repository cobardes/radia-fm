import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { SongItem } from "@/types";
import { fadeVolume } from "@/utils/fade-volume";
import Image from "next/image";
import { useContext, useEffect, useRef } from "react";
import { SEGMENT_ENDING_OFFSET_SECONDS } from "./RadioPlayerSegmentItem";

interface RadioPlayerSongItemProps {
  item: SongItem;
  onLoad: (itemId: string) => void;
}

function RadioPlayerSongItem({ item, onLoad }: RadioPlayerSongItemProps) {
  const { currentItem } = useContext(RadioPlayerContext);

  const audioRef = useRef<HTMLAudioElement>(null);

  const isActive = currentItem?.id === item.id;

  const handleAudioLoaded = () => {
    onLoad(item.id);
  };

  useEffect(() => {
    if (isActive && audioRef.current) {
      audioRef.current.volume = 0.1;
      audioRef.current.play();
      setTimeout(() => {
        if (audioRef.current) {
          fadeVolume(audioRef.current, 0.1, 0.5, 1000);
        }
      }, SEGMENT_ENDING_OFFSET_SECONDS * 1000);
    }
  }, [isActive]);

  return (
    <div>
      <div className="flex items-center gap-2">
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
      <audio
        ref={audioRef}
        src={item.audioUrl}
        preload="auto"
        onCanPlay={handleAudioLoaded}
        autoPlay={false}
      />
    </div>
  );
}

export default RadioPlayerSongItem;
