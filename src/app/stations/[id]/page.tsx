"use client";

import { useRealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { Station } from "@/types/station";
import { useParams } from "next/navigation";
import { FadeLoader } from "react-spinners";

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
    <div className="flex flex-col gap-4">
      {station.isExtending && (
        <div className="flex items-center gap-2">
          <p>Extending...</p>
          <FadeLoader color="#777" />
        </div>
      )}
      <h1>Playlist</h1>
      {station.playlist.map((item) => (
        <div key={item.id}>
          <p>
            {item.title} - {item.artist}
          </p>
          <p className="text-sm text-gray-500">{item.reason}</p>
          <div>
            {item.isInScript ? (
              <p className="text-sm text-green-500">In script</p>
            ) : (
              <p className="text-sm text-red-500">Not in script</p>
            )}
          </div>
        </div>
      ))}
      <h1>Script</h1>
      {station.script.map((item) => (
        <div key={item.id}>
          {item.type === "song" && (
            <>
              <p>
                {item.title} - {item.artist}
              </p>
            </>
          )}
          {item.type === "talk" && <p>{item.text}</p>}
        </div>
      ))}
    </div>
  );
}
