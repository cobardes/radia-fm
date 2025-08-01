import { StationLanguage } from "./station";

export interface Song {
  id: string;
  videoId: string;
  artists: string[];
  title: string;
  album?: string;
  year?: string;
  thumbnail?: string;
}

export interface Speech {
  text: string;
  language: StationLanguage;
}

export interface BaseErrorResponse {
  error: string;
}
