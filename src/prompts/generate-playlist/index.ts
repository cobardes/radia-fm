import { createPrompt } from "@/utils";

type Variables = "name" | "artist";

export const generatePlaylistPrompt =
  createPrompt<Variables>("generate-playlist");
