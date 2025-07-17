"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect, useState } from "react";

export default function Home() {
  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [playlist, setPlaylist] = useState<string>("");

  const playlistCompletion = useCompletion({
    api: "/api/generate-playlist",
    body: {
      name: trackTitle,
      artist: trackArtist,
    },
  });

  const scriptCompletion = useCompletion({
    api: "/api/generate-script",
  });

  useEffect(() => {
    if (playlistCompletion.completion && !playlistCompletion.isLoading) {
      setPlaylist(playlistCompletion.completion);
    }
  }, [playlistCompletion.completion, playlistCompletion.isLoading]);

  useEffect(() => {
    if (playlist !== "") {
      scriptCompletion.complete(playlist);
    }
  }, [playlist]);

  return (
    <div className="font-sans p-8">
      <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
        <input
          type="text"
          placeholder="Track Title"
          value={trackTitle}
          onChange={(e) => setTrackTitle(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Track Artist"
          value={trackArtist}
          onChange={(e) => setTrackArtist(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:bg-gray-300"
          onClick={() => playlistCompletion.complete("")}
          disabled={playlistCompletion.isLoading}
        >
          Generate
        </button>
        <div className="flex flex-col gap-4 whitespace-pre-wrap">
          {scriptCompletion.completion}
        </div>
        <div className="text-sm text-gray-500 whitespace-pre-wrap">
          {playlistCompletion.completion}
        </div>
      </div>
    </div>
  );
}
