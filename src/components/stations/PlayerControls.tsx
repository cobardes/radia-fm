"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";

export default function PlayerControls() {
  const { playNext, autoplayBlocked, paused, setPaused, audioManager } =
    useRadioPlayer();

  const handleStartPlayback = () => {
    // Explicitly initialize audio context on user interaction
    audioManager.initializeAudioContext();
    playNext();
  };

  return (
    <div>
      {autoplayBlocked && (
        <button
          className="bg-black text-white p-3 cursor-pointer rounded"
          onClick={handleStartPlayback}
        >
          Start playback
        </button>
      )}
      <button
        className="bg-black text-white p-3 cursor-pointer rounded"
        onClick={() => {
          // Initialize audio context on user interaction if needed
          if (paused) {
            audioManager.initializeAudioContext();
          }
          setPaused(!paused);
        }}
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
