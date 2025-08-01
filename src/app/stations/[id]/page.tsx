"use client";

import RadioPlayer from "@/components/RadioPlayer";
import NowPlaying from "@/components/stations/NowPlaying";
import {
  RadioPlayerContext,
  useRadioPlayerContextValue,
} from "@/contexts/RadioPlayerContext";
import { useRealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function StationPage() {
  const params = useParams();
  const stationId = params.id as string;
  const realtimeStation = useRealtimeStation(stationId);
  const { t } = useTranslation();

  const contextValue = useRadioPlayerContextValue(realtimeStation);

  if (realtimeStation.loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-[37.5px] h-[37.5px] rounded-full bg-black" />
      </div>
    );
  }

  if (!realtimeStation.station) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-black/60 animate-pulse">
          {t("stationNotFound")}
        </div>
      </div>
    );
  }

  return (
    <RadioPlayerContext.Provider value={contextValue}>
      <>
        <NowPlaying />
        <RadioPlayer />
      </>
    </RadioPlayerContext.Provider>
  );
}
