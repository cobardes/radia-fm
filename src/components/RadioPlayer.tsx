import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { useContext } from "react";
import RadioPlayerSegmentItem from "./RadioPlayerSegmentItem";
import RadioPlayerSongItem from "./RadioPlayerSongItem";

function RadioPlayer() {
  const { queue, autoplayBlocked } = useContext(RadioPlayerContext);

  if (autoplayBlocked) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Queue Items */}
      <div className="flex flex-col gap-2">
        {queue.map((item, index) => {
          switch (item.type) {
            case "song":
              return (
                <RadioPlayerSongItem key={item.id} item={item} index={index} />
              );
            case "talk":
              return (
                <RadioPlayerSegmentItem
                  key={item.id}
                  item={item}
                  index={index}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

export default RadioPlayer;
