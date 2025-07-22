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

const _findMoreSongs = async (
  playlist: StationPlaylist,
  count: number = 10
): Promise<StationPlaylist> => {
  console.log(chalk.yellow("Finding more songs..."));

  const playlistDraft = await model.invoke(
    await findSongsPromptTemplate.invoke({
      playlist: formatStationPlaylist(playlist),
      artist: playlist[0].artist,
      count,
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

  return newPlaylistItems;
};

export const findMoreSongs = traceable(_findMoreSongs, {
  name: "find-more-songs",
});
