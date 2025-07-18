import { Song } from "@/types";
import Image from "next/image";

function SongSearchResult({
  song,
  onSelect,
}: {
  song: Song;
  onSelect: (song: Song) => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 bg-gray-100 rounded-lg p-4 overflow-hidden cursor-pointer group"
      onClick={() => onSelect(song)}
    >
      {song.thumbnail && (
        <div className="w-10 h-10 relative">
          <Image
            src={song.thumbnail}
            alt={song.title}
            width={120}
            height={120}
            className="rounded-md absolute w-full h-full left-0 top-0 blur-lg opacity-15 scale-y-200 scale-x-[5] saturate-150 group-hover:saturate-200 group-hover:opacity-40 transition-all duration-200"
          />
          <Image
            src={song.thumbnail}
            alt={song.title}
            width={120}
            height={120}
            className="rounded w-full h-full relative z-10 outline outline-white/20"
          />
        </div>
      )}
      <div className="flex-1 flex flex-col z-10 overflow-hidden">
        <h2 className="text-sm font-semibold leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
          {song.title}
        </h2>
        <p className="text-sm text-black/60">{song.artists.join(", ")}</p>
      </div>
    </div>
  );
}

export default SongSearchResult;
