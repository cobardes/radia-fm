"use client";

import SongSearchResult from "@/components/SongSearchResult";
import { Song } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { ScaleLoader } from "react-spinners";

// Helper function to fade audio volume
const fadeAudioVolume = (
  audio: HTMLAudioElement,
  fromVolume: number,
  toVolume: number,
  duration: number
) => {
  const fadeSteps = 50;
  const stepDuration = duration / fadeSteps;
  const volumeStep = (toVolume - fromVolume) / fadeSteps;

  let currentStep = 0;
  const fadeInterval = setInterval(() => {
    currentStep++;
    const newVolume = fromVolume + volumeStep * currentStep;

    // Check if we've reached or exceeded the target volume
    if (
      (volumeStep > 0 && newVolume >= toVolume) ||
      (volumeStep < 0 && newVolume <= toVolume) ||
      currentStep >= fadeSteps
    ) {
      audio.volume = toVolume; // Set to exact target volume
      clearInterval(fadeInterval);
    } else {
      audio.volume = newVolume;
    }
  }, stepDuration);
};

export default function Home() {
  // Audio configuration constants
  const INITIAL_SONG_VOLUME = 0.1; // 50%
  const FINAL_SONG_VOLUME = 1.0; // 100%
  const FADE_DURATION = 1000; // 1 second in milliseconds
  const SONG_START_OFFSET = 3; // Start song 2 seconds before greeting ends

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  useEffect(() => {
    if (!query) return;
    setIsLoading(true);

    fetch(`/api/songs/search?query=${query}`)
      .then((res) => res.json())
      .then((data) => setResults(data.songs))
      .finally(() => setIsLoading(false));
  }, [query]);

  const handleSongSelection = useCallback(async (song: Song) => {
    setIsGeneratingSpeech(true);
    setResults([]); // Clear search results

    try {
      // Create audio objects
      const greetingAudio = new Audio(
        `/api/generate-greeting?trackTitle=${encodeURIComponent(
          song.title
        )}&trackArtist=${encodeURIComponent(song.artists[0])}`
      );

      greetingAudio.volume = 1.0;

      const songAudio = new Audio(`/api/songs/playback/${song.videoId}`);

      // Set initial song volume to 50%
      songAudio.volume = INITIAL_SONG_VOLUME;

      // Wait for both audios to be ready to play
      await Promise.all([
        new Promise((resolve) => {
          greetingAudio.addEventListener("canplay", resolve, {
            once: true,
          });
        }),
        new Promise((resolve) => {
          songAudio.addEventListener("canplay", resolve, { once: true });
        }),
      ]);

      // Play the greeting
      greetingAudio.play();

      // Calculate when to start the song (2 seconds before greeting ends)
      const greetingDuration = greetingAudio.duration;
      const songStartDelay = Math.max(
        0,
        (greetingDuration - SONG_START_OFFSET) * 1000
      ); // Convert to milliseconds

      // Start the song 2 seconds before greeting ends
      setTimeout(() => {
        songAudio.play();
      }, songStartDelay);

      // Fade song volume to 100% when greeting ends
      setTimeout(() => {
        fadeAudioVolume(
          songAudio,
          INITIAL_SONG_VOLUME,
          FINAL_SONG_VOLUME,
          FADE_DURATION
        );
      }, greetingDuration * 1000);

      // Clean up object URLs when audios finish
      greetingAudio.addEventListener("ended", () => {
        URL.revokeObjectURL(greetingAudio.src);
      });

      songAudio.addEventListener("ended", () => {
        URL.revokeObjectURL(songAudio.src);
      });
    } catch (error) {
      console.error("Error generating or playing audio:", error);
    } finally {
      setIsGeneratingSpeech(false);
    }
  }, []);

  return (
    <div className="font-sans p-8">
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">
            Let&apos;s start by searching for a song:
          </h1>
          <input
            type="text"
            placeholder="Type in and press ENTER"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setQuery(e.currentTarget.value);
              }
            }}
          />
        </div>
        {isLoading && (
          <div className="flex justify-center items-center">
            <ScaleLoader color="#000" />
          </div>
        )}
        {isGeneratingSpeech && (
          <div className="flex justify-center items-center flex-col gap-2">
            <ScaleLoader color="#000" />
            <p className="text-sm text-gray-600">Generating speech...</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {results.map((result) => (
            <SongSearchResult
              key={result.id}
              song={result}
              onSelect={handleSongSelection}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
