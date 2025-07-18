"use client";

import SongSearchResult from "@/components/SongSearchResult";
import { Song } from "@/types";
import { useEffect, useState } from "react";
import { ScaleLoader } from "react-spinners";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setIsLoading(true);

    fetch(`/api/songs/search?query=${query}`)
      .then((res) => res.json())
      .then((data) => setResults(data.songs))
      .finally(() => setIsLoading(false));
  }, [query]);

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
        <div className="grid grid-cols-2 gap-3">
          {results.map((result) => (
            <SongSearchResult key={result.id} song={result} />
          ))}
        </div>
      </div>
    </div>
  );
}
