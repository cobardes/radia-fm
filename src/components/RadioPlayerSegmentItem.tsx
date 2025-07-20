import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { SegmentItem } from "@/types";
import { useContext, useEffect, useRef } from "react";
import Spinner from "./Spinner";

export const SEGMENT_ENDING_OFFSET_SECONDS = 2;

interface RadioPlayerSegmentItemProps {
  item: SegmentItem;
  index: number;
  onLoad: (itemId: string) => void;
}

function RadioPlayerSegmentItem({
  item,
  index,
  onLoad,
}: RadioPlayerSegmentItemProps) {
  const { currentItem, currentIndex, playNext, loadedItems } =
    useContext(RadioPlayerContext);
  const finished = useRef(false);

  const audioRef = useRef<HTMLAudioElement>(null);

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

    if (audio.currentTime > audio.duration - SEGMENT_ENDING_OFFSET_SECONDS) {
      finished.current = true;
      playNext();
    }
  };

  useEffect(() => {
    if (isActive) {
      audioRef.current!.volume = 0.75;
      audioRef.current?.play();
    }
  }, [isActive]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          className={`text-sm font-medium ${isActive ? "text-blue-600" : ""}`}
        >
          {item.title}
        </div>
        {!isLoaded && <Spinner color="#000" size={20} />}
      </div>
      {shouldRenderAudio && (
        <audio
          ref={audioRef}
          src={item.audioUrl}
          onCanPlay={handleAudioLoaded}
          onTimeUpdate={handleAudioProgress}
          autoPlay={false}
          controls={true}
        />
      )}
    </div>
  );
}

export default RadioPlayerSegmentItem;
