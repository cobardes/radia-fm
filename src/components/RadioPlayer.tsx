import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useContext } from "react";
import RadioPlayerSegmentItem from "./RadioPlayerSegmentItem";
import RadioPlayerSongItem from "./RadioPlayerSongItem";

function RadioPlayer() {
  const { queue, autoplayBlocked, paused, currentItem } =
    useContext(RadioPlayerContext);

  // Calculate when wake lock should be active
  const shouldKeepScreenAwake = Boolean(
    !paused && // Music is playing
      currentItem
  );

  // Use wake lock hook to prevent screen from dimming during playback
  useWakeLock({
    enabled: shouldKeepScreenAwake,
    reacquireOnVisibilityChange: true,
  });

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
