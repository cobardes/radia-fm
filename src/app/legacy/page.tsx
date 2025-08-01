"use client";

import SongSearchResult from "@/components/SongSearchResult";
import { useCreateStationMutation } from "@/hooks/mutations/useCreateStation";
import { useRecentStations } from "@/hooks/useRecentStations";
import { Song } from "@/types";
import { StationLanguage } from "@/types/station";
import { getLanguageName } from "@/utils/language";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ScaleLoader from "react-spinners/ScaleLoader";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<StationLanguage>("en-GB");

  const router = useRouter();
  const createStationMutation = useCreateStationMutation();
  const { data: recentStations, isLoading: isLoadingRecentStations } =
    useRecentStations();
  const { t } = useTranslation();

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
        { type: "song", seedSong: song, language: selectedLanguage },
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
      <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">
            {t("searchSongTitle")}
          </h1>

          {/* Language Selector */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="language-select"
              className="text-sm font-medium text-gray-700"
            >
              {t("selectLanguage")}
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) =>
                setSelectedLanguage(e.target.value as StationLanguage)
              }
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en-GB">{getLanguageName("en-GB")}</option>
              <option value="es-ES">{getLanguageName("es-ES")}</option>
              <option value="es-CL">{getLanguageName("es-CL")}</option>
            </select>
          </div>

          <input
            type="text"
            placeholder={t("searchPlaceholder")}
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
                ? t("searching")
                : isCreatingStation
                ? t("creatingStation")
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

        {/* Recent Stations */}
        <div className="flex flex-col gap-4 mt-8">
          <h2 className="text-xl font-semibold text-center">
            {t("recentStations")}
          </h2>

          {isLoadingRecentStations ? (
            <div className="flex justify-center items-center gap-2">
              <ScaleLoader color="#000" height={20} />
              <div>{t("loadingRecentStations")}</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentStations && recentStations.length > 0 ? (
                recentStations.map((station) => {
                  const artists = station.playlist
                    .slice(0, 5)
                    .map((item) => item.artist)
                    .join(", ");

                  return (
                    <Link
                      key={station.id}
                      href={`/stations/${station.id}`}
                      className="px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm text-gray-900">{artists}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t("created")}{" "}
                        {new Date(station.createdAt).toLocaleDateString()}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-4">
                  {t("noRecentStations")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
