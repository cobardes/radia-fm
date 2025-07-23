import { useEffect } from "react";

interface UseMediaSessionProps {
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    artwork?: MediaImage[];
  };
}

export const useMediaSession = ({
  onNextTrack,
  onPreviousTrack,
  onPlay,
  onPause,
  metadata,
}: UseMediaSessionProps) => {
  useEffect(() => {
    if (!navigator.mediaSession) {
      console.warn("Media Session API not supported");
      return;
    }

    // Set up action handlers
    if (onNextTrack) {
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        console.log("Media key: Next track pressed");
        onNextTrack();
      });
    }

    if (onPreviousTrack) {
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        console.log("Media key: Previous track pressed");
        onPreviousTrack();
      });
    }

    if (onPlay) {
      navigator.mediaSession.setActionHandler("play", () => {
        console.log("Media key: Play pressed");
        onPlay();
      });
    }

    if (onPause) {
      navigator.mediaSession.setActionHandler("pause", () => {
        console.log("Media key: Pause pressed");
        onPause();
      });
    }

    // Set metadata if provided
    if (metadata && Object.keys(metadata).length > 0) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: metadata.artwork,
      });
    }

    // Cleanup function to remove action handlers
    return () => {
      if (navigator.mediaSession) {
        if (onNextTrack) {
          navigator.mediaSession.setActionHandler("nexttrack", null);
        }
        if (onPreviousTrack) {
          navigator.mediaSession.setActionHandler("previoustrack", null);
        }
        if (onPlay) {
          navigator.mediaSession.setActionHandler("play", null);
        }
        if (onPause) {
          navigator.mediaSession.setActionHandler("pause", null);
        }
      }
    };
  }, [onNextTrack, onPreviousTrack, onPlay, onPause, metadata]);
};
