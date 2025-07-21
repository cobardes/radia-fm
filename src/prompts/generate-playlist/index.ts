import { createPrompt } from "@/utils";

type Variables = "previousPlaylist" | "count";

export const generatePlaylistPrompt =
  createPrompt<Variables>("generate-playlist");
