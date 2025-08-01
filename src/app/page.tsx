"use client";

import LanguageSelector from "@/components/LanguageSelector";
import { useCreateStationMutation } from "@/hooks/mutations/useCreateStation";
import { useAnimatedPlaceholder } from "@/hooks/useAnimatedPlaceholder";
import { StationLanguage } from "@/types/station";
import { detectBrowserLanguage } from "@/utils/language";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [creatingStation, setCreatingStation] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const router = useRouter();
  const createStationMutation = useCreateStationMutation();
  const { t, i18n } = useTranslation();

  // Get animated placeholder (now handles localization internally)
  const animatedPlaceholder = useAnimatedPlaceholder();

  // Set initial language based on browser detection
  useEffect(() => {
    const detectedLanguage = detectBrowserLanguage();
    // Map the old language codes to new i18n codes
    const languageMap: Record<StationLanguage, string> = {
      "en-GB": "en",
      "es-ES": "es",
      "es-CL": "es",
    };
    const i18nLanguage = languageMap[detectedLanguage] || "en";
    i18n.changeLanguage(i18nLanguage);
  }, [i18n]);

  const handlePromptMode = useCallback(async () => {
    if (!inputValue.trim()) return;

    const query = inputValue.trim();

    setCreatingStation(true);

    // Map i18n language back to StationLanguage for the API
    const apiLanguageMap: Record<string, StationLanguage> = {
      en: "en-GB",
      es: "es-ES",
    };
    const apiLanguage = apiLanguageMap[i18n.language] || "en-GB";

    setTimeout(() => {
      createStationMutation.mutate(
        { type: "query", query, language: apiLanguage },
        {
          onSuccess: (stationData) => {
            // Redirect to the station page
            router.push(
              `/${
                debugMode && process.env.NODE_ENV === "development"
                  ? "debug"
                  : "stations"
              }/${stationData.stationId}`
            );
          },
          onError: (error) => {
            console.error("Failed to create station:", error);
          },
        }
      );
    }, 500);
  }, [inputValue, createStationMutation, router, i18n.language, debugMode]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="w-[450px] max-w-full relative px-6">
        <div className="flex w-full items-center justify-center">
          <input
            id="search"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handlePromptMode();
              }
            }}
            className={`focus:outline-black field-sizing-content transition-all duration-300 rounded-4xl font-mono tracking-tight ${
              creatingStation
                ? "w-[37.5px] h-[37.5px] rounded-full bg-black focus:outline-0"
                : "w-full h-14 min-h-14 px-5.5 py-4 focus:outline-2 bg-neutral-100 focus:bg-white"
            }`}
            placeholder={animatedPlaceholder}
            autoComplete="off"
            autoFocus
            autoCorrect="off"
          />
        </div>
        <div
          className={`absolute top-full left-0 right-0 mt-4 px-6 transition-opacity duration-300 ${
            creatingStation ? "opacity-0" : ""
          }`}
        >
          <div className="flex justify-between items-center">
            <LanguageSelector />
            <button
              className="bg-black text-white px-6 py-2 cursor-pointer font-mono uppercase font-medium tracking-tight text-sm rounded-full transition-opacity duration-150 flex items-center gap-2"
              onClick={handlePromptMode}
            >
              {t("tuneIn")}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="debug-mode"
              checked={debugMode}
              onChange={() => setDebugMode(!debugMode)}
            />
            <label htmlFor="debug-mode">{t("debugMode")}</label>
          </div>
        </div>
      </div>
    </div>
  );
}
