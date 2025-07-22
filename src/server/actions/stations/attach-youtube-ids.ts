import {
  PlaylistDraft,
  StationPlaylist,
  StationPlaylistItem,
} from "@/types/station";
import chalk from "chalk";
import { traceable } from "langsmith/traceable";
import { searchYouTube } from "../search-youtube";

const _attachYoutubeIds = async (
  playlist: PlaylistDraft
): Promise<StationPlaylist> => {
  const resolvedItems: StationPlaylist = [];

  const searchPromises = playlist.map(async (item) => {
    const searchQuery = `${item.title} ${item.artist}`;
    console.log(chalk.yellow(`Searching for: ${searchQuery}`));

    try {
      const searchResults = await searchYouTube(searchQuery);

      if (searchResults.length > 0) {
        const firstSong = searchResults[0];
        const stationPlaylistItem: StationPlaylistItem = {
          id: firstSong.id,
          title: firstSong.title,
          artist: firstSong.artists.join(", "),
          reason: item.reason,
          isInScript: false,
        };
        console.log(
          chalk.green(
            `Found: ${firstSong.title} by ${firstSong.artists.join(", ")}`
          )
        );
        return stationPlaylistItem;
      } else {
        console.log(chalk.red(`No results found for: ${searchQuery}`));
        return null;
      }
    } catch (error) {
      console.log(chalk.red(`Error searching for: ${searchQuery}`, error));
      return null;
    }
  });

  const searchResults = await Promise.all(searchPromises);

  // Filter out null results and add to resolvedItems
  for (const result of searchResults) {
    if (result) {
      resolvedItems.push(result);
    }
  }

  console.log(
    chalk.green(
      `Matched ${resolvedItems.length} items: ${resolvedItems
        .map((item) => item.title)
        .join(", ")}`
    )
  );

  return resolvedItems;
};

export const attachYoutubeIds = traceable(_attachYoutubeIds, {
  name: "get-youtube-ids",
});
