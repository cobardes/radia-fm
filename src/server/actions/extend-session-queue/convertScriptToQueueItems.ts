import {
  QueueItem,
  RadioScript,
  SegmentItem,
  SessionPlaylistItem,
  SongItem,
} from "@/types";

export async function convertScriptToQueueItems(
  radioScript: RadioScript,
  newPlaylistItems: SessionPlaylistItem[],
  currentQueue: QueueItem[],
  sessionId: string
): Promise<QueueItem[]> {
  const log = (message: string) => {
    console.log(`[SID:${sessionId.slice(0, 8)}] ${message}`);
  };

  log(`Current queue has ${currentQueue.length} items`);

  // Create new queue items from the script
  const newQueueItems: QueueItem[] = [];

  // Get all existing song IDs from the current queue for deduplication
  const existingSongIds = new Set(
    currentQueue
      .filter((item): item is SongItem => item.type === "song")
      .map((item) => item.id)
  );

  for (const scriptItem of radioScript.script) {
    if (
      scriptItem.type === "segment" &&
      scriptItem.segmentId &&
      scriptItem.text
    ) {
      // Create a segment queue item
      const segmentItem: SegmentItem = {
        type: "segment",
        id: scriptItem.segmentId,
        audioUrl: `/api/playback/segment/${scriptItem.segmentId}`,
        text: scriptItem.text,
      };

      newQueueItems.push(segmentItem);
    } else if (scriptItem.type === "song" && scriptItem.songId) {
      // Find the song in the newPlaylist by songId
      const playlistItem = newPlaylistItems.find(
        (item) => item.id === scriptItem.songId
      );

      if (playlistItem) {
        // Check if this song is already in the queue
        if (existingSongIds.has(playlistItem.song.id)) {
          log(
            `Song already in queue, skipping: ${
              playlistItem.song.title
            } by ${playlistItem.song.artists.join(", ")}`
          );
          continue;
        }

        // Create a song queue item
        const songItem: SongItem = {
          type: "song",
          id: playlistItem.song.id,
          title: playlistItem.song.title,
          artists: playlistItem.song.artists,
          thumbnail: playlistItem.song.thumbnail,
          audioUrl: `/api/playback/song/${playlistItem.song.id}`,
        };

        newQueueItems.push(songItem);
        // Add to the set to prevent duplicates within the new items as well
        existingSongIds.add(playlistItem.song.id);
        log(
          `Added song to queue: ${songItem.title} by ${songItem.artists.join(
            ", "
          )}`
        );
      } else {
        console.warn(
          `[SID:${sessionId.slice(0, 8)}] Song not found in playlist: ${
            scriptItem.songId
          }`
        );
      }
    }
  }

  // Combine old queue with new queue items
  const updatedQueue: QueueItem[] = [...currentQueue, ...newQueueItems];

  log(
    `Final queue has ${updatedQueue.length} items (${currentQueue.length} existing + ${newQueueItems.length} new)`
  );

  return updatedQueue;
}
