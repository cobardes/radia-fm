"use client";

import SongSearchResult from "@/components/SongSearchResult";
import { useCreateStationMutation } from "@/hooks/mutations/useCreateStation";
import { Song } from "@/types";
import { StationLanguage } from "@/types/station";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<StationLanguage>("British English");

  const router = useRouter();
  const createStationMutation = useCreateStationMutation();

  useEffect(() => {
    if (!query) return;
    setIsSearching(true);

    fetch(`/api/songs/search?query=${query}`)
      .then((res) => res.json())
      .then((data) => setResults(data.songs))
      .finally(() => setIsSearching(false));
  }, [query]);

  const handleSongSelection = useCallback(
    async (song: Song) => {
      setResults([]); // Clear search results

      createStationMutation.mutate(
        { seedSong: song, language: selectedLanguage },
        {
          onSuccess: (stationData) => {
            // Redirect to the station page
            router.push(`/stations/${stationData.stationId}`);
          },
          onError: (error) => {
            console.error("Failed to create station:", error);
          },
        }
      );
    },
    [createStationMutation, router, selectedLanguage]
  );

  const isCreatingStation = createStationMutation.isPending;

  return (
    <div className="font-sans p-8">
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">
            Let&apos;s start by searching for a song:
          </h1>

          {/* Language Selector */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="language-select"
              className="text-sm font-medium text-gray-700"
            >
              Select Language:
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) =>
                setSelectedLanguage(e.target.value as StationLanguage)
              }
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="British English">British English</option>
              <option value="Chilean Spanish">Chilean Spanish</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Type in and press ENTER"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setQuery(e.currentTarget.value);
                e.currentTarget.value = "";
              }
            }}
          />
        </div>

        {/* Loading states */}
        {(isSearching || isCreatingStation) && (
          <div className="flex justify-center items-center gap-2">
            <ScaleLoader color="#000" />
            <div>
              {isSearching
                ? "Searching..."
                : isCreatingStation
                ? "Creating station..."
                : ""}
            </div>
          </div>
        )}

        {/* Search results */}
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
