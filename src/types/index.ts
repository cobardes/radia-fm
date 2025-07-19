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
