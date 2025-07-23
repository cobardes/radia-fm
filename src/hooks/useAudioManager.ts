import { useCallback, useEffect, useRef, useState } from "react";

// Data structure that gets passed to visualizer components
// Contains processed audio data for creating visual representations
interface AudioVisualizerData {
  frequencyData: Uint8Array; // Frequency spectrum data (0-255 values for different frequency ranges)
  timeData: Uint8Array; // Time domain data (raw audio waveform samples)
  averageFrequency: number; // Weighted average of mid-range frequencies for overall "loudness"
}

// Information about each registered audio element in our system
// Allows us to manage multiple audio sources (songs, talk segments, etc.)
interface AudioElementInfo {
  element: HTMLAudioElement; // The actual HTML audio element
  source: MediaElementAudioSourceNode; // Web Audio API source node from the element
  gainNode: GainNode; // Individual volume control for this audio source
  isActive: boolean; // Whether this audio source is currently playing/active
}

// Configuration options for the audio manager
interface UseAudioManagerProps {
  fftSize?: number; // Size of FFT analysis (higher = more frequency detail, more CPU)
  smoothingTimeConstant?: number; // How much to smooth frequency data over time (0-1)
  targetLoudnessDb?: number; // Target loudness level in dB for normalization
}

// Information about loudness analysis for an audio element
interface LoudnessAnalysis {
  elementId: string;
  rmsPower: number;
  currentDb: number;
  targetDb: number;
  requiredGain: number;
  sampleCount: number;
  isAnalyzing: boolean;
}

export const useAudioManager = ({
  fftSize = 512,
  smoothingTimeConstant = 0.3,
  targetLoudnessDb = -6, // Common target for speech content (LUFS)
}: UseAudioManagerProps = {}) => {
  // STATE VARIABLES
  // Whether Web Audio API is supported in this browser
  const [isSupported, setIsSupported] = useState(true);

  // Current audio visualization data, null when not analyzing
  const [visualizerData, setVisualizerData] =
    useState<AudioVisualizerData | null>(null);

  // REF VARIABLES (persist across renders, don't trigger re-renders when changed)
  // Main Web Audio API context - the foundation of all audio processing
  const audioContextRef = useRef<AudioContext | null>(null);

  // Analyzes audio data to extract frequency/time information for visualization
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Master volume control - all audio sources flow through this
  const masterGainRef = useRef<GainNode | null>(null);

  // ID for the requestAnimationFrame loop that updates visualizer data
  const animationIdRef = useRef<number | null>(null);

  // Map of all registered audio elements by ID (e.g., "song-123", "talk-456")
  const audioElementsRef = useRef<Map<string, AudioElementInfo>>(new Map());

  // Map to track loudness analysis for each audio element
  const loudnessAnalysisRef = useRef<Map<string, LoudnessAnalysis>>(new Map());

  // INITIALIZATION FUNCTION
  // Sets up the Web Audio API context and core audio processing nodes
  const initializeAudioContext = useCallback(() => {
    if (audioContextRef.current) return; // Already initialized

    try {
      // Create audio context (handles browser compatibility)
      const AudioContextConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextConstructor();

      // Create master gain node (acts as a mixer for all audio sources)
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(1, audioContext.currentTime); // Start at full volume

      // Create analyser node (extracts frequency/time data for visualization)
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize; // How many frequency bins to analyze
      analyser.smoothingTimeConstant = smoothingTimeConstant; // Smoothing between frames

      // Audio flow: [individual audio sources] -> masterGain -> analyser -> speakers
      masterGain.connect(analyser);
      analyser.connect(audioContext.destination);

      // Store references for later use
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      masterGainRef.current = masterGain;

      setIsSupported(true);

      console.log("AudioContext initialized after user interaction");
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
      setIsSupported(false);
    }
  }, [fftSize, smoothingTimeConstant]);

  // AUDIO ELEMENT MANAGEMENT
  // Connects an HTML audio element to our Web Audio API processing chain
  const registerAudioElement = useCallback(
    (id: string, audioElement: HTMLAudioElement) => {
      // Initialize audio context on first registration (after user interaction)
      if (!audioContextRef.current) {
        initializeAudioContext();
      }

      if (!audioContextRef.current || !masterGainRef.current) {
        return; // Audio context still not ready
      }

      // Check if this exact element is already registered
      const existingInfo = audioElementsRef.current.get(id);
      if (existingInfo && existingInfo.element === audioElement) {
        return; // Already registered with the same element, nothing to do
      }

      // Clean up any previous registration for this ID
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
        // Create Web Audio API source from the HTML audio element
        const source =
          audioContextRef.current.createMediaElementSource(audioElement);

        // Create individual volume control for this audio source
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.setValueAtTime(1, audioContextRef.current.currentTime);

        // Connect this audio source to our processing chain:
        // audioElement -> source -> gainNode -> masterGain -> analyser -> speakers
        source.connect(gainNode);
        gainNode.connect(masterGainRef.current);

        // Store information about this audio element for later management
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
    [initializeAudioContext]
  );

  // Removes an audio element from our processing chain
  const unregisterAudioElement = useCallback((id: string) => {
    const elementInfo = audioElementsRef.current.get(id);
    if (elementInfo) {
      try {
        // Disconnect from Web Audio API graph
        elementInfo.source.disconnect();
        elementInfo.gainNode.disconnect();
        audioElementsRef.current.delete(id);
        console.log(`Unregistered audio element: ${id}`);
      } catch (error) {
        console.warn(`Failed to unregister audio element ${id}:`, error);
      }
    }
  }, []);

  // Marks an audio element as active/inactive (for potential future use)
  // Could be used to adjust individual volume levels or apply effects
  const setAudioElementActive = useCallback((id: string, isActive: boolean) => {
    const elementInfo = audioElementsRef.current.get(id);
    if (elementInfo) {
      elementInfo.isActive = isActive;
      // Future enhancement: adjust individual gain levels here
      // elementInfo.gainNode.gain.setValueAtTime(isActive ? 1 : 0.5, audioContextRef.current!.currentTime);
    }
  }, []);

  // LOUDNESS ANALYSIS FUNCTIONS
  // Calculates RMS (Root Mean Square) power from time domain audio data
  const calculateRMSPower = useCallback((timeData: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      // Convert from 0-255 to -1 to 1 range
      const sample = (timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / timeData.length);
  }, []);

  // Converts RMS power to decibels
  const rmsPowerToDb = useCallback((rmsPower: number): number => {
    if (rmsPower <= 0) return -Infinity;
    // Reference level for digital audio (full scale)
    return 20 * Math.log10(rmsPower);
  }, []);

  // Calculates the gain multiplier needed to reach target dB
  const calculateNormalizationGain = useCallback(
    (currentDb: number, targetDb: number): number => {
      if (!isFinite(currentDb) || currentDb === -Infinity) {
        return 1; // No adjustment if we can't measure current level
      }

      const dbDifference = targetDb - currentDb;
      // Convert dB difference to linear gain (10^(dB/20))
      const gainMultiplier = Math.pow(10, dbDifference / 20);

      // Limit gain to prevent clipping (max 6dB boost, unlimited cut)
      const maxGain = Math.pow(10, 6 / 20); // 6dB = ~2x gain
      return Math.min(gainMultiplier, maxGain);
    },
    []
  );

  // Starts loudness analysis for a specific audio element
  const startLoudnessAnalysis = useCallback(
    (elementId: string) => {
      const existingAnalysis = loudnessAnalysisRef.current.get(elementId);
      if (existingAnalysis?.isAnalyzing) {
        return; // Already analyzing
      }

      loudnessAnalysisRef.current.set(elementId, {
        elementId,
        rmsPower: 0,
        currentDb: -Infinity,
        targetDb: targetLoudnessDb,
        requiredGain: 1,
        sampleCount: 0,
        isAnalyzing: true,
      });

      console.log(`Started loudness analysis for ${elementId}`);
    },
    [targetLoudnessDb]
  );

  // Updates loudness analysis with new audio data
  const updateLoudnessAnalysis = useCallback(
    (elementId: string, timeData: Uint8Array) => {
      const analysis = loudnessAnalysisRef.current.get(elementId);
      if (!analysis || !analysis.isAnalyzing) return;

      const currentRms = calculateRMSPower(timeData);

      // Running average of RMS power over multiple samples
      const alpha = 0.1; // Smoothing factor
      analysis.rmsPower = analysis.rmsPower * (1 - alpha) + currentRms * alpha;
      analysis.sampleCount++;

      // After collecting enough samples (about 2-3 seconds at 60fps), calculate normalization
      const minSamples = 120; // ~2 seconds of analysis
      if (analysis.sampleCount >= minSamples) {
        analysis.currentDb = rmsPowerToDb(analysis.rmsPower);
        analysis.requiredGain = calculateNormalizationGain(
          analysis.currentDb,
          analysis.targetDb
        );

        // Apply the calculated gain to the audio element
        const elementInfo = audioElementsRef.current.get(elementId);
        if (elementInfo && analysis.requiredGain !== 1) {
          const currentTime = audioContextRef.current?.currentTime || 0;
          elementInfo.gainNode.gain.setValueAtTime(
            analysis.requiredGain,
            currentTime
          );

          console.log(
            `Applied loudness normalization to ${elementId}: ${analysis.currentDb.toFixed(
              1
            )}dB -> ${
              analysis.targetDb
            }dB (gain: ${analysis.requiredGain.toFixed(2)}x)`
          );
        }

        // Stop analyzing once we've applied normalization
        analysis.isAnalyzing = false;
      }
    },
    [calculateRMSPower, rmsPowerToDb, calculateNormalizationGain]
  );

  // Stops loudness analysis for a specific audio element
  const stopLoudnessAnalysis = useCallback((elementId: string) => {
    const analysis = loudnessAnalysisRef.current.get(elementId);
    if (analysis) {
      analysis.isAnalyzing = false;
      console.log(`Stopped loudness analysis for ${elementId}`);
    }
  }, []);

  // Gets current loudness analysis data for an audio element
  const getLoudnessAnalysis = useCallback(
    (elementId: string): LoudnessAnalysis | null => {
      return loudnessAnalysisRef.current.get(elementId) || null;
    },
    []
  );

  // VISUALIZATION DATA PROCESSING
  // Extracts and processes audio data for visual components
  const updateVisualizerData = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount; // Number of frequency bins
    const rawFrequencyData = new Uint8Array(bufferLength); // Raw frequency data (0-255)
    const timeData = new Uint8Array(bufferLength); // Time domain data (waveform)

    // Get current audio analysis data from all mixed audio sources
    analyser.getByteFrequencyData(rawFrequencyData);
    analyser.getByteTimeDomainData(timeData);

    // Update loudness analysis for all active elements
    audioElementsRef.current.forEach((elementInfo, elementId) => {
      if (elementInfo.isActive) {
        updateLoudnessAnalysis(elementId, timeData);
      }
    });

    // Process frequency data to make it more visually responsive
    const processedFrequencyData = new Uint8Array(bufferLength);

    for (let i = 0; i < bufferLength; i++) {
      // Apply logarithmic scaling and amplification for better visualization
      const normalizedValue = rawFrequencyData[i] / 255; // Convert to 0-1 range
      const amplified = Math.pow(normalizedValue, 0.6) * 1.8; // Power curve + amplification
      processedFrequencyData[i] = Math.min(255, amplified * 255); // Back to 0-255, capped
    }

    // Calculate weighted average focusing on mid-range frequencies (most audible to humans)
    const midRangeStart = Math.floor(bufferLength * 0.1); // Skip very low frequencies (bass rumble)
    const midRangeEnd = Math.floor(bufferLength * 0.7); // Skip very high frequencies (often noise)
    let weightedSum = 0;
    let weightSum = 0;

    for (let i = midRangeStart; i < midRangeEnd; i++) {
      // Weight mid frequencies more heavily as they're more perceptible
      const weight = 1 + (i - midRangeStart) / (midRangeEnd - midRangeStart);
      weightedSum += processedFrequencyData[i] * weight;
      weightSum += weight;
    }

    // Calculate overall "loudness" for simple visualizers
    const averageFrequency = weightSum > 0 ? weightedSum / weightSum : 0;

    // Update state with new visualization data
    setVisualizerData({
      frequencyData: processedFrequencyData,
      timeData,
      averageFrequency,
    });

    // Schedule next update (creates smooth animation loop)
    animationIdRef.current = requestAnimationFrame(updateVisualizerData);
  }, [updateLoudnessAnalysis]);

  // VISUALIZATION CONTROL
  // Starts the visualization data extraction loop
  const startVisualization = useCallback(() => {
    // Initialize audio context if not already done
    if (!audioContextRef.current) {
      initializeAudioContext();
    }

    if (!analyserRef.current || animationIdRef.current) return; // Already running or not ready

    // Resume audio context if suspended (required by browser autoplay policies)
    if (audioContextRef.current?.state === "suspended") {
      console.log("Resuming suspended AudioContext");
      audioContextRef.current
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully");
        })
        .catch((error) => {
          console.warn("Failed to resume AudioContext:", error);
        });
    }

    // Start the animation loop
    updateVisualizerData();
  }, [updateVisualizerData, initializeAudioContext]);

  // Stops the visualization data extraction loop
  const stopVisualization = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current); // Stop the animation loop
      animationIdRef.current = null;
    }
    setVisualizerData(null); // Clear visualization data
  }, []);

  // LIFECYCLE EFFECTS
  // Don't initialize audio context on mount - wait for user interaction
  // useEffect(() => {
  //   initializeAudioContext();
  // }, [initializeAudioContext]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopVisualization(); // Stop animation loop

      // Disconnect all registered audio elements
      audioElementsRef.current.forEach((elementInfo) => {
        try {
          elementInfo.source.disconnect();
          elementInfo.gainNode.disconnect();
        } catch (error) {
          // Ignore disconnection errors during cleanup
        }
      });
      audioElementsRef.current.clear();

      // Close audio context to free resources
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, [stopVisualization]);

  // RETURN API
  // Expose these functions and data to components using this hook
  return {
    visualizerData, // Current audio visualization data (null when not running)
    isSupported, // Whether Web Audio API is supported
    startVisualization, // Start extracting visualization data
    stopVisualization, // Stop extracting visualization data
    registerAudioElement, // Connect an HTML audio element to our system
    unregisterAudioElement, // Disconnect an HTML audio element
    setAudioElementActive, // Mark an audio element as active/inactive
    audioContext: audioContextRef.current, // Raw audio context (advanced use)
    initializeAudioContext, // Manually initialize audio context after user interaction

    // Loudness normalization functions
    startLoudnessAnalysis, // Start analyzing loudness for an audio element
    stopLoudnessAnalysis, // Stop analyzing loudness for an audio element
    getLoudnessAnalysis, // Get current loudness analysis data
  };
};
