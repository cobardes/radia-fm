"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";

export default function PlayerControls() {
  const { playNext, autoplayBlocked, paused, setPaused } = useRadioPlayer();

  return (
    <div>
      {autoplayBlocked && (
        <button
          className="bg-black text-white p-3 cursor-pointer rounded"
          onClick={playNext}
        >
          Start playback
        </button>
      )}
      <button
        className="bg-black text-white p-3 cursor-pointer rounded"
        onClick={() => setPaused(!paused)}
      >
        {paused ? "Play" : "Pause"}
      </button>
      <button
        className="bg-black text-white p-3 cursor-pointer rounded"
        onClick={playNext}
      >
        Next
      </button>
    </div>
  );
}
