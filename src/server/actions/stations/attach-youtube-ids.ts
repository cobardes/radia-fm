import { Song } from "@/types";
import {
  PlaylistDraft,
  PlaylistDraftItem,
  StationPlaylist,
  StationPlaylistItem,
} from "@/types/station";
import chalk from "chalk";
import { traceable } from "langsmith/traceable";
import similarity from "similarity";
import { checkPlayability, searchYouTube } from "../search-youtube";

// Helper function to clean title (remove parentheses except if contains "Remix")
const cleanTitle = (title: string): string => {
  return title
    .replace(/\([^)]*\)/g, (match) => {
      return match.toLowerCase().includes("remix") ? match : "";
    })
    .trim();
};

// Helper function to calculate similarity score between original item and search result
const calculateSimilarity = (
  originalItem: PlaylistDraftItem,
  searchResult: Song
): number => {
  const originalTitle = cleanTitle(originalItem.title.toLowerCase());
  const resultTitle = cleanTitle(searchResult.title.toLowerCase());

  const originalArtist = originalItem.artist.toLowerCase();
  const resultArtist = searchResult.artists.join(", ").toLowerCase();

  const titleSimilarity = similarity(originalTitle, resultTitle);
  const artistSimilarity = similarity(originalArtist, resultArtist);

  // Average of title and artist similarity
  return (titleSimilarity + artistSimilarity) / 2;
};

const _attachYoutubeIds = async (
  playlist: PlaylistDraft
): Promise<StationPlaylist> => {
  const resolvedItems: StationPlaylist = [];
  const SIMILARITY_THRESHOLD = 0.5; // Define threshold

  const searchPromises = playlist.map(async (item) => {
    const searchQuery = `${item.title} ${item.artist}`;
    console.log(chalk.yellow(`Searching for: ${searchQuery}`));

    try {
      const searchResults = await searchYouTube(searchQuery);

      if (searchResults.length > 0) {
        // Calculate similarity for each result and sort by similarity
        const resultsWithSimilarity = searchResults.map((result) => ({
          ...result,
          similarity: calculateSimilarity(item, result),
        }));

        // Sort by similarity (highest first)
        resultsWithSimilarity.sort((a, b) => b.similarity - a.similarity);

        // Try up to 3 results that pass the similarity threshold
        const maxAttempts = 3;
        let attemptCount = 0;

        for (const candidate of resultsWithSimilarity) {
          if (attemptCount >= maxAttempts) break;

          // Check if candidate passes similarity threshold
          if (candidate.similarity >= SIMILARITY_THRESHOLD) {
            attemptCount++;

            console.log(
              chalk.blue(
                `Checking playability for: ${
                  candidate.title
                } by ${candidate.artists.join(
                  ", "
                )} (similarity: ${candidate.similarity.toFixed(
                  3
                )}, attempt ${attemptCount})`
              )
            );

            // Check playability
            const isPlayable = await checkPlayability(candidate.id);

            if (isPlayable) {
              const stationPlaylistItem: StationPlaylistItem = {
                id: candidate.id,
                title: candidate.title,
                artist: candidate.artists.join(", "),
                reason: item.reason,
              };
              console.log(
                chalk.green(
                  `Found playable match: ${
                    candidate.title
                  } by ${candidate.artists.join(
                    ", "
                  )} (similarity: ${candidate.similarity.toFixed(3)})`
                )
              );
              return stationPlaylistItem;
            } else {
              console.log(
                chalk.yellow(
                  `Not playable: ${candidate.title} by ${candidate.artists.join(
                    ", "
                  )}, trying next result...`
                )
              );
            }
          } else {
            // No more results pass the similarity threshold
            break;
          }
        }

        console.log(
          chalk.red(
            `No playable match found for: ${searchQuery} after ${attemptCount} attempts`
          )
        );
        return null;
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
