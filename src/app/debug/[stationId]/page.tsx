"use client";
import { useRealtimeStation } from "@/hooks/stations/useRealtimeStation";
import { StationPlaylistItem, StationQueueSong } from "@/types/station";
import { getThumbnailUrl } from "@/utils/get-thumbnail-url";
import Image from "next/image";
import { useParams } from "next/navigation";
import ScaleLoader from "react-spinners/ScaleLoader";

function PlaylistItem({ item }: { item: StationPlaylistItem }) {
  return (
    <div>
      <div className="font-medium">{item.title}</div>
      <div className="text-sm text-neutral-600">{item.artist}</div>
      <div className="text-xs text-neutral-600">{item.reason}</div>
    </div>
  );
}

function SongItem({ song }: { song: StationQueueSong }) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={getThumbnailUrl(song.id)}
        width={40}
        height={40}
        alt={song.title}
      />
      <div>
        <div className="font-medium">{song.title}</div>
        <div className="text-sm text-neutral-600">{song.artist}</div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const params = useParams();
  const stationId = params.stationId as string;
  const realtimeStation = useRealtimeStation(stationId);

  if (!realtimeStation.station?.queue) {
    return <div>nothing here</div>;
  }

  const { queue, playlist, statusMessage, guidelines, isExtending } =
    realtimeStation.station;

  return (
    <div className="py-12">
      <div className="w-full flex flex-col gap-6 px-4">
        <div>
          <span className="font-bold">Status:</span> {statusMessage}
        </div>
        <div>
          <span className="font-bold">Is extending:</span>
          <span>
            {isExtending ? (
              <span className="flex items-center gap-2">
                <span>Yes</span>
                <ScaleLoader color="#000" className="w-4 h-4" />
              </span>
            ) : (
              <span>No</span>
            )}
          </span>
        </div>
        {guidelines && (
          <div>
            <span className="font-bold">Guidelines:</span> {guidelines}
          </div>
        )}
        <div className="flex gap-12">
          <div className="flex-1">
            <div className="font-bold">Playlist</div>
            <div>
              {playlist.map((item) => (
                <PlaylistItem key={item.id} item={item} />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="font-medium text-xl mb-4">Queue</div>
            <div className="flex flex-col gap-4">
              {queue.map((item) =>
                item.type === "song" ? (
                  <SongItem key={item.id} song={item} />
                ) : (
                  <div key={item.id}>{item.text}</div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
