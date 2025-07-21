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
