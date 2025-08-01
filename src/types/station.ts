import { LocaleCode } from "@/utils/language";
import { z } from "zod";

export type StationLanguage = LocaleCode;

export interface Station {
  id: string;
  playlist: StationPlaylist;
  queue: StationQueue;
  isExtending: boolean;
  language: StationLanguage;
  createdAt: string;
  creatorId: string;
  currentIndex: number;
  lastPlaybackUpdate: string;
  statusMessage?: string;
  guidelines?: string;
}

export type StationPlaylist = StationPlaylistItem[];

export interface StationPlaylistItem {
  id: string;
  title: string;
  artist: string;
  reason: string;
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

export type StationQueue = StationQueueItem[];

export interface StationQueueSong {
  id: string;
  type: "song";
  title: string;
  artist: string;
  reason: string;
  audioUrl: string;
}

export interface StationQueueTalkSegment {
  id: string;
  type: "talk";
  text: string;
  audioUrl: string;
}

export type StationQueueItem = StationQueueSong | StationQueueTalkSegment;

export const guidelinesSchema = z.object({
  guidelines: z.string(),
  initialSong: z.object({
    title: z.string(),
    artist: z.string(),
    reason: z.string(),
  }),
});

export type Guidelines = z.infer<typeof guidelinesSchema>;
