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
  title?: string;
};

export type QueueItem = SongItem | SegmentItem;

export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export interface BaseErrorResponse {
  error: string;
}

// Session Management Types - Separated Structure

// Session metadata (private - server only)
export interface SessionMetadata {
  id: string;
  createdAt: string;
  lastActivity: string;
  seedSong: Song;
  currentIndex: number;
}

// Session queue (public - readable by clients)
export interface SessionQueue {
  sessionId: string;
  queue: QueueItem[];
  lastUpdated: string;
}

// Legacy combined interface (for backward compatibility)
export interface RadioSession {
  id: string;
  createdAt: string;
  lastActivity: string;
  seedSong: Song;
  currentIndex: number;
  queue: QueueItem[];
}
