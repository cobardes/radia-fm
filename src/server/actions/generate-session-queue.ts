import { generatePlaylistPrompt, generateScriptPrompt } from "@/prompts";
import { queues, sessions, talkSegments } from "@/server/db";
import {
  QueueItem,
  SegmentItem,
  SessionMetadata,
  SessionPlaylistItem,
  SessionQueue,
  SongItem,
} from "@/types";
import { formatPlaylistAsString } from "@/utils";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { randomUUID } from "crypto";
import { z } from "zod";
import { searchYouTube } from "./search-youtube";

export async function generateSessionQueue(sessionId: string) {
  console.log(`[SID:${sessionId.slice(0, 8)}] Generating session queue...`);

  const sessionRef = sessions.doc(sessionId);
  const queueRef = queues.doc(sessionId);

  const session = await sessionRef.get();
  const sessionQueue = await queueRef.get();

  if (!session.exists || !sessionQueue.exists) {
    throw new Error("Session not found");
  }

  const sessionData = session.data() as SessionMetadata;

  console.log(
    `[SID:${sessionId.slice(0, 8)}] Previous playlist:`,
    formatPlaylistAsString(sessionData.playlist)
  );

  const playlistDraft = await generateText({
    model: google("gemini-2.5-pro", {
      useSearchGrounding: true,
    }),
    prompt: generatePlaylistPrompt({
      previousPlaylist: formatPlaylistAsString(sessionData.playlist),
    }),
  });

  console.log(playlistDraft.text);

  const structuredPlaylistDraft = await generateObject({
    model: openai("gpt-4.1-nano"),
    prompt: `Structure the given playlist. Retain the full text of the reasons below each song.

    Playlist:
    ${playlistDraft.text}
    `,
    schema: z.object({
      playlist: z.array(
        z.object({
          title: z.string().describe("The title of the song"),
          artist: z.string().describe("The artist of the song"),
          reason: z
            .string()
            .describe(
              "The full reason for the song being in the playlist. Do not truncate the reason."
            ),
        })
      ),
    }),
  });

  console.log(structuredPlaylistDraft.object);

  // Search for each song and create SessionPlaylistItem objects
  const newPlaylist: SessionPlaylistItem[] = [...sessionData.playlist];

  for (const item of structuredPlaylistDraft.object.playlist) {
    const searchQuery = `${item.title} ${item.artist}`;
    console.log(`[SID:${sessionId.slice(0, 8)}] Searching for: ${searchQuery}`);

    const searchResults = await searchYouTube(searchQuery);

    if (searchResults.length > 0) {
      const firstSong = searchResults[0];
      const sessionPlaylistItem: SessionPlaylistItem = {
        id: firstSong.id,
        song: firstSong,
        reason: item.reason,
      };
      newPlaylist.push(sessionPlaylistItem);
      console.log(
        `[SID:${sessionId.slice(0, 8)}] Found: ${
          firstSong.title
        } by ${firstSong.artists.join(", ")}`
      );
    } else {
      console.log(
        `[SID:${sessionId.slice(0, 8)}] No results found for: ${searchQuery}`
      );
    }
  }

  console.log(
    `[SID:${sessionId.slice(0, 8)}] Generated ${
      newPlaylist.length
    } playlist items`
  );

  await sessionRef.update({
    playlist: newPlaylist,
  });

  console.log(`[SID:${sessionId.slice(0, 8)}] Generating script...`);

  const scriptDraft = await generateObject({
    model: openai("gpt-4.1"),
    prompt: generateScriptPrompt({
      playlist: formatPlaylistAsString(newPlaylist, true),
      language: "English",
    }),
    schema: z.object({
      script: z
        .array(
          z.discriminatedUnion("type", [
            z.object({
              type: z.literal("song").describe("Song item"),
              title: z.string().describe("The title of the song"),
              artist: z.string().describe("The artist of the song"),
              songId: z.string().describe("The id of the song"),
            }),
            z.object({
              type: z.literal("segment").describe("Talk segment item"),
              text: z.string().describe("The text of the talk segment"),
            }),
          ])
        )
        .describe(
          "The script of the session. Item type can be either 'song' or 'segment'"
        ),
    }),
  });

  console.log(
    `[SID:${sessionId.slice(0, 8)}] Generated script with ${
      scriptDraft.object.script.length
    } items`
  );

  // Get the current queue
  const currentSessionQueue = await queueRef.get();
  const currentQueue: QueueItem[] = currentSessionQueue.exists
    ? (currentSessionQueue.data() as SessionQueue).queue
    : [];

  console.log(
    `[SID:${sessionId.slice(0, 8)}] Current queue has ${
      currentQueue.length
    } items`
  );

  // Create talkSegments for each segment in the script and build new queue items
  const newQueueItems: QueueItem[] = [];

  // Get all existing song IDs from the current queue for deduplication
  const existingSongIds = new Set(
    currentQueue
      .filter((item): item is SongItem => item.type === "song")
      .map((item) => item.id)
  );

  for (const scriptItem of scriptDraft.object.script) {
    if (scriptItem.type === "segment") {
      // Create a new talkSegment in the database
      const segmentId = randomUUID();

      await talkSegments.doc(segmentId).set({
        text: scriptItem.text,
      });

      console.log(
        `[SID:${sessionId.slice(0, 8)}] Created talkSegment: ${segmentId}`
      );

      // Create a segment queue item
      const segmentItem: SegmentItem = {
        type: "segment",
        id: segmentId,
        audioUrl: `/api/playback/segment/${segmentId}`,
        title: "DJ Commentary", // Optional title for segments
      };

      newQueueItems.push(segmentItem);
    } else if (scriptItem.type === "song") {
      // Find the song in the newPlaylist by songId
      const playlistItem = newPlaylist.find(
        (item) => item.id === scriptItem.songId
      );

      if (playlistItem) {
        // Check if this song is already in the queue
        if (existingSongIds.has(playlistItem.song.id)) {
          console.log(
            `[SID:${sessionId.slice(0, 8)}] Song already in queue, skipping: ${
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
        console.log(
          `[SID:${sessionId.slice(0, 8)}] Added song to queue: ${
            songItem.title
          } by ${songItem.artists.join(", ")}`
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

  console.log(
    `[SID:${sessionId.slice(0, 8)}] Final queue has ${
      updatedQueue.length
    } items (${currentQueue.length} existing + ${newQueueItems.length} new)`
  );

  // Update the session queue in the database
  await queueRef.update({
    queue: updatedQueue,
  });

  console.log(
    `[SID:${sessionId.slice(0, 8)}] Session queue updated successfully`
  );

  return scriptDraft.object;
}
