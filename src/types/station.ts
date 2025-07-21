import { Song } from "./index";

export type StationLanguage = "British English" | "Chilean Spanish";

export interface Station {
  id: string;
  playlist: StationPlaylistItem[];
  script: StationScriptItem[];
  isExtending: boolean;
  createdAt: string;
}

export interface StationPlaylistItem {
  id: string;
  song: Song;
  reason: string;
  isInScript: boolean;
}

export interface StationScriptSong {
  id: string;
  type: "song";
  song: Song;
  audioUrl: string;
}

export interface StationScriptTalkSegment {
  id: string;
  type: "talk_segment";
  text: string;
  audioUrl: string;
}

export type StationScriptItem = StationScriptSong | StationScriptTalkSegment;
