import { useCallback, useEffect, useRef, useState } from "react";

interface AudioVisualizerData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  averageFrequency: number;
}

interface AudioElementInfo {
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gainNode: GainNode;
  isActive: boolean;
}

interface UseAudioManagerProps {
  fftSize?: number;
  smoothingTimeConstant?: number;
}

export const useAudioManager = ({
  fftSize = 512,
  smoothingTimeConstant = 0.3,
}: UseAudioManagerProps = {}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [visualizerData, setVisualizerData] =
    useState<AudioVisualizerData | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const audioElementsRef = useRef<Map<string, AudioElementInfo>>(new Map());

  const initializeAudioContext = useCallback(() => {
    if (audioContextRef.current) return;

    try {
      // Create audio context
      const AudioContextConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextConstructor();

      // Create master gain node (acts as a mixer)
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(1, audioContext.currentTime);

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;

      // Connect: masterGain -> analyser -> destination
      masterGain.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      masterGainRef.current = masterGain;

      setIsSupported(true);
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
      setIsSupported(false);
    }
  }, [fftSize, smoothingTimeConstant]);

  const registerAudioElement = useCallback(
    (id: string, audioElement: HTMLAudioElement) => {
      if (!audioContextRef.current || !masterGainRef.current) {
        return;
      }

      // Check if already registered with the same element
      const existingInfo = audioElementsRef.current.get(id);
      if (existingInfo && existingInfo.element === audioElement) {
        return; // Already registered with the same element, nothing to do
      }

      // If registered with different element, unregister first
      if (existingInfo) {
        try {
          existingInfo.source.disconnect();
          existingInfo.gainNode.disconnect();
          audioElementsRef.current.delete(id);
        } catch (error) {
          console.warn(
            `Failed to cleanup previous registration for ${id}:`,
            error
          );
        }
      }

      try {
        // Create source from audio element
        const source =
          audioContextRef.current.createMediaElementSource(audioElement);

        // Create individual gain node for this audio element
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.setValueAtTime(1, audioContextRef.current.currentTime);

        // Connect: source -> gainNode -> masterGain
        source.connect(gainNode);
        gainNode.connect(masterGainRef.current);

        // Store the audio element info
        audioElementsRef.current.set(id, {
          element: audioElement,
          source,
          gainNode,
          isActive: false,
        });

        console.log(`Registered audio element: ${id}`);
      } catch (error) {
        console.warn(`Failed to register audio element ${id}:`, error);
      }
    },
    []
  );

  const unregisterAudioElement = useCallback((id: string) => {
    const elementInfo = audioElementsRef.current.get(id);
    if (elementInfo) {
      try {
        elementInfo.source.disconnect();
        elementInfo.gainNode.disconnect();
        audioElementsRef.current.delete(id);
        console.log(`Unregistered audio element: ${id}`);
      } catch (error) {
        console.warn(`Failed to unregister audio element ${id}:`, error);
      }
    }
  }, []);

  const setAudioElementActive = useCallback((id: string, isActive: boolean) => {
    const elementInfo = audioElementsRef.current.get(id);
    if (elementInfo) {
      elementInfo.isActive = isActive;
      // You could adjust individual gain levels here if needed
      // elementInfo.gainNode.gain.setValueAtTime(isActive ? 1 : 0.5, audioContextRef.current!.currentTime);
    }
  }, []);

  const updateVisualizerData = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const rawFrequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    // Get frequency and time domain data from the mixed audio
    analyser.getByteFrequencyData(rawFrequencyData);
    analyser.getByteTimeDomainData(timeData);

    // Process frequency data for better visual responsiveness
    const processedFrequencyData = new Uint8Array(bufferLength);

    for (let i = 0; i < bufferLength; i++) {
      // Apply logarithmic scaling and amplification for better visualization
      const normalizedValue = rawFrequencyData[i] / 255;
      const amplified = Math.pow(normalizedValue, 0.6) * 1.8; // Amplify and apply power curve
      processedFrequencyData[i] = Math.min(255, amplified * 255);
    }

    // Calculate weighted average focusing on mid-range frequencies (more audible)
    const midRangeStart = Math.floor(bufferLength * 0.1); // Skip very low frequencies
    const midRangeEnd = Math.floor(bufferLength * 0.7); // Skip very high frequencies
    let weightedSum = 0;
    let weightSum = 0;

    for (let i = midRangeStart; i < midRangeEnd; i++) {
      const weight = 1 + (i - midRangeStart) / (midRangeEnd - midRangeStart); // Weight mid frequencies more
      weightedSum += processedFrequencyData[i] * weight;
      weightSum += weight;
    }

    const averageFrequency = weightSum > 0 ? weightedSum / weightSum : 0;

    setVisualizerData({
      frequencyData: processedFrequencyData,
      timeData,
      averageFrequency,
    });

    animationIdRef.current = requestAnimationFrame(updateVisualizerData);
  }, []);

  const startVisualization = useCallback(() => {
    if (!analyserRef.current || animationIdRef.current) return;

    // Resume audio context if needed
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }

    updateVisualizerData();
  }, [updateVisualizerData]);

  const stopVisualization = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    setVisualizerData(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAudioContext();
  }, [initializeAudioContext]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopVisualization();

      // Disconnect all audio elements
      audioElementsRef.current.forEach((elementInfo) => {
        try {
          elementInfo.source.disconnect();
          elementInfo.gainNode.disconnect();
        } catch (error) {
          // Ignore disconnection errors on cleanup
        }
      });
      audioElementsRef.current.clear();

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, [stopVisualization]);

  return {
    visualizerData,
    isSupported,
    startVisualization,
    stopVisualization,
    registerAudioElement,
    unregisterAudioElement,
    setAudioElementActive,
    audioContext: audioContextRef.current,
  };
};
