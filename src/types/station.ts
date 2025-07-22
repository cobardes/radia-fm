import { z } from "zod";

export type StationLanguage = "British English" | "Chilean Spanish";

export interface Station {
  id: string;
  playlist: StationPlaylist;
  script: StationScript;
  isExtending: boolean;
  createdAt: string;
}

export type StationPlaylist = StationPlaylistItem[];

export interface StationPlaylistItem {
  id: string;
  title: string;
  artist: string;
  reason: string;
  isInScript: boolean;
}

export const playlistDraftSchema = z.object({
  playlist: z.array(
    z.object({
      title: z.string().describe("The title of the song"),
      artist: z.string().describe("The artist of the song"),
      reason: z
        .string()
        .describe("The reason for the song being in the playlist"),
    })
  ),
});

export type PlaylistDraft = z.infer<typeof playlistDraftSchema.shape.playlist>;
export type PlaylistDraftItem = z.infer<
  typeof playlistDraftSchema.shape.playlist
>[number];

export type StationScript = StationScriptItem[];

export interface StationScriptSong {
  id: string;
  type: "song";
  title: string;
  artist: string;
  audioUrl: string;
}

export interface StationScriptTalkSegment {
  id: string;
  type: "talk";
  text: string;
  audioUrl: string;
}

export type StationScriptItem = StationScriptSong | StationScriptTalkSegment;
