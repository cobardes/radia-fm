"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { getThumbnailUrl } from "@/utils/get-thumbnail-url";
import Image from "next/image";

export default function NowPlaying() {
  const { currentItem } = useRadioPlayer();

  if (!currentItem) return null;

  const title = currentItem.type === "song" ? currentItem.title : "Nuestro DJ";

  return (
    <div className="w-screen h-screen">
      <div className="w-full h-full flex flex-col gap-6 items-center justify-center">
        <div className="w-xs aspect-square rounded-md bg-neutral-300 relative">
          <Image
            src={getThumbnailUrl(currentItem.id, 640)}
            alt={currentItem.type === "song" ? "Song" : "Talk"}
            width={640}
            height={640}
            className="w-full h-full object-cover absolute inset-0 saturate-200 opacity-60 brightness-110 blur-2xl -z-10"
          />
          <Image
            src={getThumbnailUrl(currentItem.id, 640)}
            alt={currentItem.type === "song" ? "Song" : "Talk"}
            width={640}
            height={640}
            className="w-full h-full object-cover relative rounded-md"
          />
        </div>
        <div className="flex flex-col gap-0.5 items-center">
          <div className="text-2xl font-bold">{title}</div>
          <div className="text text-neutral-500 ">
            {currentItem.type === "song"
              ? currentItem.artist
              : currentItem.text}
          </div>
        </div>
      </div>
    </div>
  );
}
