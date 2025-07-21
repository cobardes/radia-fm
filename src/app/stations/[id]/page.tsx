"use client";

import { useRealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { Station } from "@/types/station";
import { useParams } from "next/navigation";

export default function StationPage() {
  const params = useParams();
  const stationId = params.id as string;

  const { station } = useRealtimeStation(stationId);

  if (!station) {
    return <div>Station not found</div>;
  }

  return <StationInfo station={station} />;
}

function StationInfo({ station }: { station: Station }) {
  return (
    <div>
      <div>
        {station.playlist.map((item) => (
          <div key={item.id}>
            <p>{item.song.title}</p>
            <p>{item.song.artists.map((artist) => artist).join(", ")}</p>
            <p>{item.reason}</p>
          </div>
        ))}
      </div>
      <p>{station.createdAt}</p>
    </div>
  );
}
