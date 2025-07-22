"use client";

import RadioPlayer from "@/components/RadioPlayer";
import { useRealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { Station } from "@/types/station";
import { useParams } from "next/navigation";
import { useCallback } from "react";
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
  const extendStationQueue = useCallback(async () => {
    await fetch(`/api/stations/extend/${station.id}`, {
      method: "POST",
    });
  }, [station.id]);

  return (
    <div className="flex flex-col gap-4">
      {station.isExtending && (
        <div className="flex items-center gap-2">
          <p>Extending...</p>
          <FadeLoader color="#777" />
        </div>
      )}
      <button onClick={() => extendStationQueue()}>Extend</button>
      <RadioPlayer queue={station.queue} />
      <h1>Playlist</h1>
      {station.playlist.map((item) => (
        <div key={item.id}>
          <p>
            **{item.title}** - {item.artist}
          </p>
          <p className="text-sm text-gray-500">{item.reason}</p>
        </div>
      ))}
      <h1>Script</h1>
      {station.queue.map((item) => (
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
