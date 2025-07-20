"use client";

import RadioPlayer from "@/components/RadioPlayer";
import SongSearchResult from "@/components/SongSearchResult";
import { QueueItem, Song } from "@/types";
import { useCallback, useEffect, useState } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Session-based state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    if (!query) return;
    setIsSearching(true);

    fetch(`/api/songs/search?query=${query}`)
      .then((res) => res.json())
      .then((data) => setResults(data.songs))
      .finally(() => setIsSearching(false));
  }, [query]);

  // Load session data when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        const data = await response.json();

        if (data.session) {
          setQueue(data.session.queue);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      }
    };

    loadSession();
  }, [sessionId]);

  const handleSongSelection = useCallback(async (song: Song) => {
    setResults([]); // Clear search results
    setIsCreatingSession(true);

    try {
      // Create session with seed song
      const sessionResponse = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seedSong: song }),
      });

      const sessionData = await sessionResponse.json();
      const newSessionId = sessionData.sessionId;
      setSessionId(newSessionId);

      // Create initial queue items
      const speechUrl = `/api/generate-greeting?trackTitle=${song.title}&trackArtist=${song.artists[0]}`;
      const songUrl = `/api/songs/playback/${song.videoId}`;

      const initialQueue: QueueItem[] = [
        {
          type: "segment",
          id: "greeting" + Math.random().toString(36).substring(2, 15),
          title: "DJ Greeting",
          audioUrl: speechUrl,
        },
        {
          type: "song",
          id: song.id,
          title: song.title,
          artists: song.artists,
          thumbnail: song.thumbnail,
          audioUrl: songUrl,
        },
      ];

      // Update session with initial queue
      await fetch(`/api/sessions/${newSessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queue: initialQueue }),
      });

      setQueue(initialQueue);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreatingSession(false);
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
                e.currentTarget.value = "";
              }
            }}
          />
        </div>
        {(isSearching || isCreatingSession) && (
          <div className="flex justify-center items-center gap-2">
            <ScaleLoader color="#000" />
            <div>{isSearching ? "Searching..." : "Creating session..."}</div>
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
        {sessionId && (
          <div className="text-sm text-gray-500 text-center">
            Session: {sessionId.slice(0, 8)}...
          </div>
        )}
        <RadioPlayer queue={queue} />
      </div>
    </div>
  );
}
