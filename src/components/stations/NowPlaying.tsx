"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";

export default function NowPlaying() {
  const { currentItem } = useRadioPlayer();

  if (!currentItem) return null;

  return <div></div>;
}
