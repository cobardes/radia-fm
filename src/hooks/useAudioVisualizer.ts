import { RadioPlayerContext } from "@/contexts/RadioPlayerContext";
import { useContext, useEffect } from "react";

interface UseAudioVisualizerProps {
  audioElementId: string;
  audioElement: HTMLAudioElement | null;
  isActive?: boolean;
  enableLoudnessNormalization?: boolean; // New prop to enable loudness analysis
}

export const useAudioVisualizer = ({
  audioElementId,
  audioElement,
  isActive = false,
  enableLoudnessNormalization = false,
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

  // Update active state and handle loudness analysis
  useEffect(() => {
    if (audioManager.setAudioElementActive) {
      audioManager.setAudioElementActive(audioElementId, isActive);
    }

    // Start/stop loudness analysis based on active state and normalization setting
    if (
      enableLoudnessNormalization &&
      audioManager.startLoudnessAnalysis &&
      audioManager.stopLoudnessAnalysis
    ) {
      if (isActive) {
        audioManager.startLoudnessAnalysis(audioElementId);
      } else {
        audioManager.stopLoudnessAnalysis(audioElementId);
      }
    }
  }, [audioElementId, isActive, enableLoudnessNormalization]); // Removed audioManager from dependencies

  return {
    visualizerData: audioManager.visualizerData,
    isSupported: audioManager.isSupported,
    startVisualization: audioManager.startVisualization,
    stopVisualization: audioManager.stopVisualization,
    // Expose loudness analysis functions
    getLoudnessAnalysis: audioManager.getLoudnessAnalysis
      ? () => audioManager.getLoudnessAnalysis(audioElementId)
      : undefined,
  };
};
