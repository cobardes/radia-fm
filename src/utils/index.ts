export { createPrompt } from "./create-prompt";
export { formatPlaylistAsString } from "./format-playlist";
export { formatStationPlaylist } from "./format-station-playlist";
export { formatStationQueue } from "./format-station-queue";
export { generateSpeech } from "./generate-speech";
export { getMessageContentText } from "./get-message-content-text";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};
