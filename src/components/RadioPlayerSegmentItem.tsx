import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { SegmentItem } from "@/types";
import { useContext, useEffect, useRef } from "react";

export const SEGMENT_ENDING_OFFSET_SECONDS = 3;

interface RadioPlayerSegmentItemProps {
  item: SegmentItem;
  onLoad: (itemId: string) => void;
}

function RadioPlayerSegmentItem({ item, onLoad }: RadioPlayerSegmentItemProps) {
  const { currentItem, playNext } = useContext(RadioPlayerContext);

  const audioRef = useRef<HTMLAudioElement>(null);

  const isActive = currentItem?.id === item.id;

  const handleAudioLoaded = () => {
    onLoad(item.id);
  };

  const handleAudioProgress = (
    event: React.SyntheticEvent<HTMLAudioElement>
  ) => {
    const audio = event.target as HTMLAudioElement;

    if (audio.currentTime > audio.duration - SEGMENT_ENDING_OFFSET_SECONDS) {
      playNext();
    }
  };

  useEffect(() => {
    if (isActive) {
      audioRef.current?.play();
    }
  }, [isActive]);

  return (
    <div>
      <div className="text-sm font-medium">{item.title}</div>
      <audio
        ref={audioRef}
        src={item.audioUrl}
        preload="auto"
        onCanPlay={handleAudioLoaded}
        onTimeUpdate={handleAudioProgress}
        autoPlay={false}
      />
    </div>
  );
}

export default RadioPlayerSegmentItem;
