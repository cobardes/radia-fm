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
      console.log("Paused because state changed");
      audioRef.current?.pause();
    } else if (!paused && isActive) {
      console.log("Playing because state changed");
      audioRef.current?.play();
    }
  }, [paused, isActive]);

  useEffect(() => {
    if (isActive) {
      if (playbackState === "playing") {
        console.log("Playing because <audio> playback state changed");
        setPaused(false);
      } else if (playbackState === "paused") {
        console.log("Paused because <audio> playback state changed");
        setPaused(true);
      }
    }
  }, [playbackState]);
};
