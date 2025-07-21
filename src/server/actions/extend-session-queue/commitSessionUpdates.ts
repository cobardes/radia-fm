import { queues, sessions } from "@/server/db";
import { QueueItem, SessionPlaylistItem } from "@/types";

export async function commitSessionUpdates(
  sessionId: string,
  existingPlaylist: SessionPlaylistItem[],
  newPlaylistItems: SessionPlaylistItem[],
  updatedQueue: QueueItem[]
): Promise<void> {
  const log = (message: string) => {
    console.log(`[SID:${sessionId.slice(0, 8)}] ${message}`);
  };

  const sessionRef = sessions.doc(sessionId);
  const queueRef = queues.doc(sessionId);

  // Update the session with the new playlist items
  await sessionRef.update({
    playlist: [...existingPlaylist, ...newPlaylistItems],
  });

  // Update the session queue in the database
  await queueRef.update({
    queue: updatedQueue,
    extending: false,
  });

  log("Session queue updated successfully");
}
