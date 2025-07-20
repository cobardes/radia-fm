import { SessionPlaylistItem } from "@/types";

/**
 * Formats a SessionPlaylistItem array into a numbered list string
 * @param playlist - Array of SessionPlaylistItem objects
 * @returns Formatted string with numbered list of songs and reasons
 */
export function formatPlaylistAsString(
  playlist: SessionPlaylistItem[],
  includeSongIds: boolean = false
): string {
  return playlist
    .map((item, index) => {
      const number = index + 1;
      return `${number}. **${item.song.title}** - ${item.song.artists[0]}${
        includeSongIds ? ` (ID: ${item.song.id})` : ""
      }\n${item.reason}`;
    })
    .join("\n\n");
}
