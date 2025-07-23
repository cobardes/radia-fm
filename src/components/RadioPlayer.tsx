import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { useContext } from "react";
import RadioPlayerSegmentItem from "./RadioPlayerSegmentItem";
import RadioPlayerSongItem from "./RadioPlayerSongItem";
import { PulseVisualizer } from "./visualizers/PulseVisualizer";
import { SimpleBarsVisualizer } from "./visualizers/SimpleBarsVisualizer";

function RadioPlayer() {
  const { queue, audioManager } = useContext(RadioPlayerContext);

  return (
    <div className="flex flex-col gap-4">
      {/* Global Audio Visualizer - shows all mixed audio */}
      {audioManager.visualizerData && (
        <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-600">Now Playing</div>

          {/* Main visualizer display */}
          <div className="flex items-center gap-4">
            {audioManager.isSupported ? (
              <PulseVisualizer
                averageFrequency={audioManager.visualizerData.averageFrequency}
                size={80}
                color="#3b82f6"
              />
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Audio visualization not supported
                </div>
                <SimpleBarsVisualizer isPlaying={true} barCount={8} />
              </div>
            )}
          </div>

          {/* Audio level indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{
                width: `${Math.min(
                  (audioManager.visualizerData.averageFrequency / 255) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

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
