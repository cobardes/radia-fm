import type { StationQueue } from "@/types/station";

/**
 * Formats a StationQueue object into a markdown document
 *
 * @param queue The StationQueue to format
 * @returns A formatted markdown string
 */
export function formatStationQueue(queue: StationQueue): string {
  return queue
    .map((item) => {
      switch (item.type) {
        case "song":
          return `**${item.title}** - ${item.artist}\n${item.reason}`;
        case "talk":
          return `**DJ Commentary**\n${item.text}`;
        default:
          // This should never happen with proper typing, but good to have for safety
          return "";
      }
    })
    .filter(Boolean) // Remove any empty strings
    .join("\n\n"); // Separate each item with double newlines
}
