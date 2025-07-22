import { useLayoutEffect, useState } from "react";

type PlaybackState =
  | "not_started"
  | "playing"
  | "paused"
  | "error"
  | "ended"
  | "canplay";

const PlaybackEventMap: Record<string, PlaybackState> = {
  error: "error",
  playing: "playing",
  pause: "paused",
  ended: "ended",
  canplay: "canplay",
};

export const usePlaybackState = (
  audioRef: React.RefObject<HTMLAudioElement | null>
) => {
  const [playbackState, setPlaybackState] =
    useState<PlaybackState>("not_started");

  useLayoutEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    console.log("attaching event listeners");

    const eventHandlers: Record<string, () => void> = {};
    const events = ["error", "playing", "pause", "ended", "canplay"];

    // Create and store handler functions
    for (const event of events) {
      eventHandlers[event] = () => {
        setPlaybackState(PlaybackEventMap[event]);
      };
      audioElement.addEventListener(event, eventHandlers[event]);
    }

    return () => {
      // Remove the exact same handler functions
      for (const event of events) {
        audioElement.removeEventListener(event, eventHandlers[event]);
      }
    };
  }, []);

  return playbackState;
};
