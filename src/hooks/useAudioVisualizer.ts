import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { useContext, useEffect } from "react";

interface UseAudioVisualizerProps {
  audioElementId: string;
  audioElement: HTMLAudioElement | null;
  isActive?: boolean;
}

export const useAudioVisualizer = ({
  audioElementId,
  audioElement,
  isActive = false,
}: UseAudioVisualizerProps) => {
  const { audioManager } = useContext(RadioPlayerContext);

  // Register/unregister audio element
  useEffect(() => {
    if (audioElement && audioManager.registerAudioElement) {
      audioManager.registerAudioElement(audioElementId, audioElement);

      return () => {
        audioManager.unregisterAudioElement(audioElementId);
      };
    }
  }, [audioElement, audioElementId]); // Removed audioManager from dependencies

  // Update active state
  useEffect(() => {
    if (audioManager.setAudioElementActive) {
      audioManager.setAudioElementActive(audioElementId, isActive);
    }
  }, [audioElementId, isActive]); // Removed audioManager from dependencies

  return {
    visualizerData: audioManager.visualizerData,
    isSupported: audioManager.isSupported,
    startVisualization: audioManager.startVisualization,
    stopVisualization: audioManager.stopVisualization,
  };
};
