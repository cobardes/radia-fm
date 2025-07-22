"use client";

import RadioPlayer from "@/components/RadioPlayer";
import { useRealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { useParams } from "next/navigation";
import { FadeLoader } from "react-spinners";

export default function StationPage() {
  const params = useParams();
  const stationId = params.id as string;

  const { station, extend } = useRealtimeStation(stationId);

  if (!station) {
    return <div>Station not found</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {station.isExtending && (
        <div className="flex items-center gap-2">
          <p>Extending...</p>
          <FadeLoader color="#777" />
        </div>
      )}
      <button
        className="bg-blue-500 text-white p-2 rounded-md"
        onClick={extend}
      >
        Extend
      </button>
      <RadioPlayer queue={station.queue} onReachingEnd={extend} />
    </div>
  );
}
