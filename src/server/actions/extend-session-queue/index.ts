import { langsmithClient } from "@/lib/langsmith";
import { queues, sessions } from "@/server/db";
import { RadioScript, SessionMetadata, SessionQueue } from "@/types";
import { traceable } from "langsmith/traceable";
import { commitSessionUpdates } from "./commitSessionUpdates";
import { convertScriptToQueueItems } from "./convertScriptToQueueItems";
import { createScriptTalkSegments } from "./createScriptTalkSegments";
import { generateNewPlaylistSongs } from "./generateNewPlaylistSongs";
import { generateRadioScript } from "./generateRadioScript";
import { resolvePlaylistOnYouTube } from "./resolvePlaylistOnYouTube";

const _extendSessionQueue = async (sessionId: string): Promise<RadioScript> => {
  const log = (message: string) => {
    console.log(`[SID:${sessionId.slice(0, 8)}] ${message}`);
  };

  log("Extending session queue...");

  const sessionRef = sessions.doc(sessionId);
  const queueRef = queues.doc(sessionId);

  const session = await sessionRef.get();
  const sessionQueue = await queueRef.get();

  if (!session.exists || !sessionQueue.exists) {
    throw new Error("Session not found");
  }

  if (sessionQueue.data()?.extending) {
    log("Session is already extending");
    return { script: [] };
  }

  await queueRef.update({
    extending: true,
  });

  const sessionData = session.data() as SessionMetadata;
  const currentQueue = (sessionQueue.data() as SessionQueue).queue;

  try {
    // Step 1: Generate new playlist songs using AI
    const playlistSongs = await generateNewPlaylistSongs(
      sessionData,
      10,
      sessionId
    );

    // Step 2: Resolve playlist songs on YouTube
    const newPlaylistItems = await resolvePlaylistOnYouTube(
      playlistSongs,
      sessionId
    );

    // Step 3: Generate radio script
    const radioScript = await generateRadioScript(
      [
        sessionData.playlist[sessionData.playlist.length - 1],
        ...newPlaylistItems,
      ],
      sessionData.language,
      sessionId
    );

    // Step 4: Create talk segments in the database
    await createScriptTalkSegments(
      radioScript,
      sessionData.language,
      sessionId
    );

    // Step 5: Convert script to queue items with deduplication
    const updatedQueue = await convertScriptToQueueItems(
      radioScript,
      newPlaylistItems,
      currentQueue,
      sessionId
    );

    // Step 6: Commit all updates to the database
    await commitSessionUpdates(
      sessionId,
      sessionData.playlist,
      newPlaylistItems,
      updatedQueue
    );

    return radioScript;
  } catch (error) {
    // Reset the extending flag if something goes wrong
    await queueRef.update({
      extending: false,
    });
    throw error;
  } finally {
    // Flush traces to LangSmith
    await langsmithClient.awaitPendingTraceBatches();
  }
};

export const extendSessionQueue = traceable(_extendSessionQueue, {
  name: "extend-session-queue",
  client: langsmithClient,
});

// Re-export all the individual functions for potential direct usage
export { commitSessionUpdates } from "./commitSessionUpdates";
export { convertScriptToQueueItems } from "./convertScriptToQueueItems";
export { createScriptTalkSegments } from "./createScriptTalkSegments";
export { generateNewPlaylistSongs } from "./generateNewPlaylistSongs";
export { generateRadioScript } from "./generateRadioScript";
export { resolvePlaylistOnYouTube } from "./resolvePlaylistOnYouTube";

// Re-export centralized types and schemas from @/types for convenience
export type {
  PlaylistSong,
  RadioScript,
  ScriptItem,
  StructuredPlaylist,
} from "@/types";

export {
  playlistSongSchema,
  radioScriptSchema,
  scriptItemSchema,
  structuredPlaylistSchema,
} from "@/types";
