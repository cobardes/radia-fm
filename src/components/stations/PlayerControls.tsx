"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";

export default function PlayerControls() {
  const { currentIndex, playNext } = useRadioPlayer();

  return (
    <div>{currentIndex === -1 && <button onClick={playNext}>Play</button>}</div>
  );
}
