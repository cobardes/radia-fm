export interface Song {
  id: string;
  videoId: string;
  artists: string[];
  title: string;
  album?: string;
  year?: string;
  thumbnail?: string;
}

export type SongItem = Pick<Song, "id" | "title" | "artists" | "thumbnail"> & {
  type: "song";
  audioUrl: string;
};

export type SegmentItem = {
  type: "segment";
  audioUrl: string;
  id: string;
  text: string;
};

export type QueueItem = SongItem | SegmentItem;

export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export interface BaseErrorResponse {
  error: string;
}

export type TalkSegmentLanguage = "British English" | "Neutral Spanish";

export interface SessionMetadata {
  playlist: SessionPlaylistItem[];
  language: TalkSegmentLanguage;
  createdAt: string;
}

export interface SessionPlaylistItem {
  id: string;
  song: Song;
  reason: string;
}

export interface SessionQueue {
  queue: QueueItem[];
  extending: boolean;
}

export interface TalkSegment {
  text: string;
  language: TalkSegmentLanguage;
}

// Zod schemas for AI-generated data structures
import { z } from "zod";

// Schema for individual playlist songs from AI generation
export const playlistSongSchema = z.object({
  title: z.string().describe("The title of the song"),
  artist: z.string().describe("The artist of the song"),
  reason: z
    .string()
    .describe(
      "The full reason for the song being in the playlist. Do not truncate the reason."
    ),
});

// Schema for structured playlist response
export const structuredPlaylistSchema = z.object({
  playlist: z.array(playlistSongSchema),
});

// Schema for script items (songs and segments)
export const scriptItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("song").describe("Song item"),
    title: z.string().describe("The title of the song"),
    artist: z.string().describe("The artist of the song"),
    songId: z.string().describe("The id of the song"),
    segmentId: z.string().optional(), // for consistency
  }),
  z.object({
    type: z.literal("segment").describe("Talk segment item"),
    text: z.string().describe("The text of the talk segment"),
    segmentId: z.string().optional(), // added by createScriptTalkSegments
  }),
]);

// Schema for radio script response
export const radioScriptSchema = z.object({
  script: z
    .array(scriptItemSchema)
    .describe(
      "The script of the session. Item type can be either 'song' or 'segment'"
    ),
});

// Inferred types - single source of truth!
export type PlaylistSong = z.infer<typeof playlistSongSchema>;
export type StructuredPlaylist = z.infer<typeof structuredPlaylistSchema>;
export type ScriptItem = z.infer<typeof scriptItemSchema>;
export type RadioScript = z.infer<typeof radioScriptSchema>;
