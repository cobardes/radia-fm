"use client";

import RadioPlayer from "@/components/RadioPlayer";
import SongSearchResult from "@/components/SongSearchResult";
import { useRealtimeQueue } from "@/hooks/useRealtimeQueue";
import { useCreateSession } from "@/hooks/useSessionMutation";
import { Song } from "@/types";
import { useCallback, useEffect, useState } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Session-based state
  const [sessionId, setSessionId] = useState<string | null>(null);

  const createSessionMutation = useCreateSession();

  // Real-time session queue data
  const {
    queue,
    loading: queueLoading,
    error: queueError,
  } = useRealtimeQueue(sessionId);

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

      createSessionMutation.mutate(
        { seedSong: song },
        {
          onSuccess: (sessionData) => {
            setSessionId(sessionData.sessionId);
          },
          onError: (error) => {
            console.error("Failed to create session:", error);
          },
        }
      );
    },
    [createSessionMutation]
  );

  const isCreatingSession = createSessionMutation.isPending;

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
                e.currentTarget.value = "";
              }
            }}
          />
        </div>
        {(isSearching || isCreatingSession || queueLoading) && (
          <div className="flex justify-center items-center gap-2">
            <ScaleLoader color="#000" />
            <div>
              {isSearching
                ? "Searching..."
                : isCreatingSession
                ? "Creating session..."
                : queueLoading
                ? "Loading queue..."
                : ""}
            </div>
          </div>
        )}
        {queueError && (
          <div className="text-red-500 text-center">Error: {queueError}</div>
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
        {sessionId && (
          <div className="text-sm text-gray-500 text-center">
            Session: {sessionId.slice(0, 8)}...
          </div>
        )}
        {/* Use queue from real-time updates */}
        <RadioPlayer queue={queue} />
      </div>
    </div>
  );
}
