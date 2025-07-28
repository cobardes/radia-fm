"use server";

import { Song } from "@/types";
import { YTNodes } from "youtubei.js";
import innertube from "../youtube";

export async function searchYouTube(query: string): Promise<Song[]> {
  try {
    const search = await innertube.music.search(query, {
      type: "song",
    });

    const songs =
      search.songs?.contents.filterType(YTNodes.MusicResponsiveListItem) ?? [];

    return songs.slice(0, 12).map((song) => {
      return {
        id: song.id ?? "",
        videoId: song.id ?? "",
        title: song.title ?? "",
        artists: song.artists?.map((artist) => artist.name) ?? [],
        album: song.album?.name,
        year: song.year,
        thumbnail: song.thumbnails[0].url,
      };
    });
  } catch (error) {
    console.error("YouTube search error:", error);
    return [];
  }
}

export async function checkPlayability(videoId: string) {
  const video = await innertube.getInfo(videoId);

  if (
    video.playability_status?.status === "UNPLAYABLE" ||
    video.playability_status?.status === "LOGIN_REQUIRED"
  ) {
    return false;
  }

  return true;
}

export async function getVideoInfo(videoId: string) {
  const video = await innertube.getInfo(videoId);

  return video;
}
