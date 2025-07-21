import { PlaylistSong, SessionPlaylistItem } from "@/types";
import { searchYouTube } from "../search-youtube";

export async function resolvePlaylistOnYouTube(
  playlistSongs: PlaylistSong[],
  sessionId: string
): Promise<SessionPlaylistItem[]> {
  const log = (message: string) => {
    console.log(`[SID:${sessionId.slice(0, 8)}] ${message}`);
  };

  const newPlaylistItems: SessionPlaylistItem[] = [];

  for (const item of playlistSongs) {
    const searchQuery = `${item.title} ${item.artist}`;
    log(`Searching for: ${searchQuery}`);

    const searchResults = await searchYouTube(searchQuery);

    if (searchResults.length > 0) {
      const firstSong = searchResults[0];
      const sessionPlaylistItem: SessionPlaylistItem = {
        id: firstSong.id,
        song: firstSong,
        reason: item.reason,
      };
      newPlaylistItems.push(sessionPlaylistItem);
      log(`Found: ${firstSong.title} by ${firstSong.artists.join(", ")}`);
    } else {
      log(`No results found for: ${searchQuery}`);
    }
  }

  log(
    `New playlist items: ${newPlaylistItems
      .map((item) => item.song.title)
      .join(", ")}`
  );

  return newPlaylistItems;
}
