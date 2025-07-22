import { PlaylistDraft, StationPlaylist } from "@/types/station";

/**
 * Formats a StationPlaylist array into a numbered list string
 * @param playlist - Array of StationPlaylistItem objects
 * @returns Formatted string with numbered list of songs and reasons
 */
export function formatStationPlaylist(
  playlist: StationPlaylist | PlaylistDraft,
  includeSongIds: boolean = false
): string {
  return playlist
    .map((item, index) => {
      const number = index + 1;
      return `${number}. **${item.title}** - ${item.artist}${
        includeSongIds && "id" in item ? ` (ID: ${item.id})` : ""
      }\n${item.reason}`;
    })
    .join("\n\n");
}
