import { createPrompt } from "@/utils";

type Variables = "previousPlaylist";

export const generatePlaylistPrompt =
  createPrompt<Variables>("generate-playlist");
