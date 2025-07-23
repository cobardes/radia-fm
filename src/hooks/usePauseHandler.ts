import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { useEffect } from "react";
import { usePlaybackState } from "./usePlaybackState";

export const usePauseHandler = (
  audioRef: React.RefObject<HTMLAudioElement | null>,
  isActive: boolean
) => {
  const { paused, setPaused } = useRadioPlayer();

  const playbackState = usePlaybackState(audioRef);

  useEffect(() => {
    if (paused && isActive) {
      audioRef.current?.pause();
    } else if (!paused && isActive) {
      audioRef.current?.play();
    }
  }, [paused, isActive]);

  useEffect(() => {
    if (isActive) {
      if (playbackState === "playing") {
        setPaused(false);
      } else if (playbackState === "paused") {
        setPaused(true);
      }
    }
  }, [playbackState]);
};
