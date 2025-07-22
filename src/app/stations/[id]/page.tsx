"use client";

import RadioPlayer from "@/components/RadioPlayer";
import NowPlaying from "@/components/stations/NowPlaying";
import {
  RadioPlayerContext,
  useRadioPlayerContextValue,
} from "@/contexts/RadioPlayerContext";
import { useRealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { useParams } from "next/navigation";

export default function StationPage() {
  const params = useParams();
  const stationId = params.id as string;
  const realtimeStation = useRealtimeStation(stationId);

  const contextValue = useRadioPlayerContextValue(realtimeStation);

  if (!realtimeStation.station) {
    return <div>Station not found</div>;
  }

  return (
    <RadioPlayerContext.Provider value={contextValue}>
      <StationPageContent />
    </RadioPlayerContext.Provider>
  );
}

function StationPageContent() {
  return (
    <div className="flex flex-col gap-4">
      <NowPlaying />
      <RadioPlayer />
    </div>
  );
}
