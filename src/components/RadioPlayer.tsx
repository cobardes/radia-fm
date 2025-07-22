import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import RadioPlayerSegmentItem from "./RadioPlayerSegmentItem";
import RadioPlayerSongItem from "./RadioPlayerSongItem";

function RadioPlayer() {
  const { queue } = useRadioPlayer();

  return (
    <div className="hidden">
      {queue.map((item, index) => {
        switch (item.type) {
          case "song":
            return (
              <RadioPlayerSongItem key={item.id} item={item} index={index} />
            );
          case "talk":
            return (
              <RadioPlayerSegmentItem key={item.id} item={item} index={index} />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export default RadioPlayer;
