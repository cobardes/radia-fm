import { findSongsPromptTemplate } from "@/prompts/stations/find-songs";
import { playlistDraftSchema, StationPlaylist } from "@/types/station";
import { formatStationPlaylist, getMessageContentText } from "@/utils";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import chalk from "chalk";
import { traceable } from "langsmith/traceable";
import { attachYoutubeIds } from "./attach-youtube-ids";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
}).bindTools([{ googleSearch: {} }]);

const structuredModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite-preview-06-17",
}).withStructuredOutput(playlistDraftSchema);

const DEFAULT_GUIDELINES = `In this scenario, you are doing a "deep dive". This means you are focusing on the discography and influences of *{artist}*. Aim for a 60/40 split between songs by *{artist}* and songs by other artists, interweaving them. Introduce 2 or 3 deep cuts into the mix. Choose songs that were made by or are concretely related to the band in some way.`;

const _findMoreSongs = async (
  playlist: StationPlaylist,
  count: number = 10,
  guidelines?: string
): Promise<StationPlaylist> => {
  console.log(chalk.yellow("Finding more songs..."));

  const isInitialSongFinding = playlist.length === 0;

  let playlistFormatted: string;
  let artistForPrompt: string = "";
  let contextGuidelines: string;

  if (isInitialSongFinding) {
    playlistFormatted =
      "This is the beginning of the playlist. No songs have been selected yet.";
    contextGuidelines =
      guidelines ||
      "You are starting a new music playlist. Use your best judgment to select songs that work well together.";
  } else {
    playlistFormatted = formatStationPlaylist(playlist);
    artistForPrompt = playlist[0].artist;
    contextGuidelines =
      guidelines || DEFAULT_GUIDELINES.replace("{artist}", artistForPrompt);
  }

  const playlistDraft = await model.invoke(
    await findSongsPromptTemplate.invoke({
      playlist: playlistFormatted,
      artist: artistForPrompt,
      count,
      guidelines: contextGuidelines,
    }),
    { runName: "find-more-songs" }
  );

  const playlistDraftText = getMessageContentText(playlistDraft.content);

  console.log(chalk.green(`Playlist drafted correctly. Structuring...`));

  const { playlist: structuredPlaylistDraft } = await structuredModel.invoke(
    `Structure the given playlist. Retain the full text of the reasons below each song.

    Playlist:
    ${playlistDraftText}
    `,
    { runName: "structure-playlist-draft" }
  );

  console.log(chalk.green(`Structured playlist draft correctly.`));
  console.log(chalk.yellow("Finding streaming links..."));

  const newPlaylistItems = await attachYoutubeIds(structuredPlaylistDraft);

  // If this was initial song finding, return just the new songs
  // Otherwise, combine with existing playlist
  if (isInitialSongFinding) {
    return newPlaylistItems;
  } else {
    return [...playlist, ...newPlaylistItems];
  }
};

export const findMoreSongs = traceable(_findMoreSongs, {
  name: "find-more-songs",
});
