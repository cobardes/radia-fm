import { langsmithClient } from "@/lib/langsmith";
import { generatePlaylistPrompt } from "@/prompts";
import {
  PlaylistSong,
  SessionMetadata,
  structuredPlaylistSchema,
} from "@/types";
import { formatPlaylistAsString } from "@/utils";
import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { traceable } from "langsmith/traceable";

const _generateNewPlaylistSongs = async (
  sessionData: SessionMetadata,
  count: number = 10,
  sessionId: string
): Promise<PlaylistSong[]> => {
  const log = (message: string) => {
    console.log(`[SID:${sessionId.slice(0, 8)}] ${message}`);
  };

  log(`Previous playlist contains ${sessionData.playlist.length} items`);
  log(`Drafting playlist...`);

  const playlistDraft = await generateText({
    model: google("gemini-2.5-flash", {
      useSearchGrounding: true,
    }),
    prompt: generatePlaylistPrompt({
      previousPlaylist: formatPlaylistAsString(sessionData.playlist),
      artist: sessionData.playlist[0].song.artists[0],
      count: count.toString(),
    }),
    experimental_telemetry: {
      isEnabled: true,
      metadata: {
        ls_run_name: "draft-playlist",
        sessionId: sessionId.slice(0, 8),
        artist: sessionData.playlist[0].song.artists[0],
        count: count.toString(),
      },
    },
  });

  log(`Playlist drafted correctly. Structuring...`);

  const structuredPlaylistDraft = await generateObject({
    model: google("gemini-2.5-flash-lite-preview-06-17"),
    prompt: `Structure the given playlist. Retain the full text of the reasons below each song.

    Playlist:
    ${playlistDraft.text}
    `,
    schema: structuredPlaylistSchema,
    experimental_telemetry: {
      isEnabled: true,
      metadata: {
        ls_run_name: "structure-playlist",
        sessionId: sessionId.slice(0, 8),
      },
    },
  });

  log(`Structured playlist draft correctly.`);

  return structuredPlaylistDraft.object.playlist;
};

export const generateNewPlaylistSongs = traceable(_generateNewPlaylistSongs, {
  name: "generate-new-playlist-songs",
  client: langsmithClient,
});
