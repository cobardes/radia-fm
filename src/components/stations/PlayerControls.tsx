"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";

export default function PlayerControls() {
  const { playNext, autoplayBlocked } = useRadioPlayer();

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
    </div>
  );
}
