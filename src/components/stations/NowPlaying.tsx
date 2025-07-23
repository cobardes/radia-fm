"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { getThumbnailUrl } from "@/utils/get-thumbnail-url";
import { MaterialSymbol } from "material-symbols";
import Image from "next/image";

function ControlButton({
  icon,
  iconPosition = "left",
  label,
  onClick,
}: {
  icon: MaterialSymbol;
  iconPosition?: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`bg-white text-black py-2 px-4 cursor-pointer rounded-full uppercase font-mono font-semibold tracking-wide text-sm flex items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-neutral-400 ${
        iconPosition === "left" ? "pl-3" : "pr-3"
      }`}
      onClick={onClick}
    >
      {iconPosition === "left" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
      <span>{label}</span>
      {iconPosition === "right" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
    </button>
  );
}

export default function NowPlaying() {
  const { currentItem, playNext, paused, setPaused } = useRadioPlayer();

  if (!currentItem) return null;

  const title = currentItem.type === "song" ? currentItem.title : "Nuestro DJ";

  return (
    <div className="w-screen h-screen">
      <div className="absolute left-0 top-0 p-3 px-4.5">
        <div className="font-mono font-semibold tracking-tight">rad(ia)</div>
      </div>
      <div className="absolute inset-0 top-auto flex items-center justify-center p-6 gap-3">
        <ControlButton
          icon={paused ? "play_circle" : "pause_circle"}
          label={paused ? "Reanudar" : "Pausar"}
          onClick={() => {
            if (paused) {
              setPaused(false);
            } else {
              setPaused(true);
            }
          }}
        />
        <ControlButton
          icon="arrow_circle_right"
          label="Saltar"
          iconPosition="right"
          onClick={playNext}
        />
      </div>
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
