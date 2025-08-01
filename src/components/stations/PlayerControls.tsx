"use client";

import { useRadioPlayer } from "@/contexts/RadioPlayerContext";
import { useTranslation } from "react-i18next";
import { ControlButton } from "./ControlButton";

export default function PlayerControls() {
  const {
    playNext,
    autoplayBlocked,
    paused,
    setPaused,
    currentItem,
    setAutoplayBlocked,
    queue,
  } = useRadioPlayer();
  const { t } = useTranslation();

  if (queue.length === 0) {
    return <div />;
  }

  if (autoplayBlocked) {
    return (
      <ControlButton
        icon="play_circle"
        label={t("playThisStation")}
        onClick={() => {
          setAutoplayBlocked(false);
        }}
        iconPosition="right"
      />
    );
  }

  if (!currentItem) {
    return null;
  }

  return (
    <div className="flex gap-3">
      <ControlButton
        icon={paused ? "play_circle" : "pause_circle"}
        label={paused ? t("resume") : t("pause")}
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
        label={t("skip")}
        iconPosition="right"
        onClick={playNext}
      />
    </div>
  );
}
