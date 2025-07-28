"use client";

import { useCreateStationMutation } from "@/hooks/mutations/useCreateStation";
import { useAnimatedPlaceholder } from "@/hooks/useAnimatedPlaceholder";
import { StationLanguage } from "@/types/station";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const placeholders = [
  "super depressive 90s grunge",
  "top chilean reggaeton right now",
  "produced by ludwig göransson",
  "top 100 songs of 2025",
  "a song about love",
  "dreamy shoegaze with reverb",
  "melodic techno for late nights",
  "british punk from the 80s",
  "songs in movies by sofia coppola",
  "indie sleaze",
  "songs about the ocean",
];

function LanguageButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`bg-white text-black px-4 py-2 cursor-pointer font-mono uppercase font-medium tracking-tight text-sm rounded-full transition-opacity duration-150 ${
        active ? "opacity-100" : "opacity-50"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState<StationLanguage>("British English");
  const [creatingStation, setCreatingStation] = useState(false);

  const router = useRouter();
  const createStationMutation = useCreateStationMutation();

  const animatedPlaceholder = useAnimatedPlaceholder(placeholders);

  const handlePromptMode = useCallback(async () => {
    if (!inputValue.trim()) return;

    const query = inputValue.trim();

    setCreatingStation(true);

    setTimeout(() => {
      createStationMutation.mutate(
        { type: "query", query, language: selectedLanguage },
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
    }, 500);
  }, [inputValue, createStationMutation, router, selectedLanguage]);

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
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
            <div className="flex gap-3">
              <LanguageButton
                active={selectedLanguage === "British English"}
                label="🇬🇧 EN-GB"
                onClick={() => setSelectedLanguage("British English")}
              />
              <LanguageButton
                active={selectedLanguage === "Chilean Spanish"}
                label="🇨🇱 ES-CL"
                onClick={() => setSelectedLanguage("Chilean Spanish")}
              />
            </div>
            <button
              className="bg-black text-white px-6 py-2 cursor-pointer font-mono uppercase font-medium tracking-tight text-sm rounded-full transition-opacity duration-150 flex items-center gap-2"
              onClick={handlePromptMode}
            >
              Tune in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
