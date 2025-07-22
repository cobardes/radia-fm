"use server";

import { langsmithClient } from "@/lib/langsmith";
import { beginSessionPrompt } from "@/prompts";
import db from "@/server/firestore";
import {
  SessionMetadata,
  SessionQueue,
  Song,
  TalkSegment,
  TalkSegmentLanguage,
} from "@/types";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { randomUUID } from "crypto";
import { traceable } from "langsmith/traceable";
import { z } from "zod";
import { extendSessionQueue } from "./extend-session-queue";

const _startSession = async (
  seedSong: Song,
  language: TalkSegmentLanguage
): Promise<string> => {
  if (!seedSong || !seedSong.id) {
    throw new Error("Valid seedSong is required");
  }

  const sessionId = randomUUID().slice(0, 8);
  const greetingSegmentId = randomUUID().slice(0, 8);

  console.log(`[SID:${sessionId.slice(0, 8)}] Generating greeting...`);

  const seedSongInfo = await generateText({
    model: google("gemini-2.5-flash", {
      useSearchGrounding: true,
    }),
    prompt: `
    Research the song ${seedSong.title} by ${seedSong.artists[0]} and write a brief 200 word paragraph about it. Return the paragraph and nothing else.
    `,
    experimental_telemetry: {
      isEnabled: true,
      metadata: {
        ls_run_name: "generate-seed-song-info",
      },
    },
  });

  const generatedGreeting = await generateObject({
    model: openai("gpt-4.1-mini"),
    prompt: beginSessionPrompt({
      songTitle: seedSong.title,
      artistName: seedSong.artists[0],
      language,
    }),
    schema: z.object({
      text: z.string().describe("The text of the greeting"),
    }),
    experimental_telemetry: {
      isEnabled: true,
      metadata: {
        ls_run_name: "generate-greeting",
        sessionId: sessionId.slice(0, 8),
        language,
        seedSong: seedSong.title,
      },
    },
  });

  console.log(
    `[SID:${sessionId.slice(0, 8)}] Generated greeting: ${
      generatedGreeting.object.text
    }`
  );

  const greetingSegment: TalkSegment = {
    text: generatedGreeting.object.text,
    language,
  };

  await db
    .collection("talkSegments")
    .doc(greetingSegmentId)
    .set(greetingSegment);

  console.log(
    `[SID:${sessionId.slice(
      0,
      8
    )}] Saved greeting segment: ${greetingSegmentId}`
  );

  const speechUrl = `/api/playback/segment/${greetingSegmentId}`;
  const songUrl = `/api/playback/song/${seedSong.id}`;

  const sessionQueue: SessionQueue = {
    queue: [
      {
        type: "segment",
        id: greetingSegmentId,
        text: greetingSegment.text,
        audioUrl: speechUrl,
      },
      {
        type: "song",
        id: seedSong.id,
        title: seedSong.title,
        artists: seedSong.artists,
        thumbnail: seedSong.thumbnail,
        audioUrl: songUrl,
      },
    ],
    extending: false,
  };

  const sessionMetadata: SessionMetadata = {
    playlist: [
      {
        id: seedSong.id,
        song: seedSong,
        reason: `This song was selected by the user. ${seedSongInfo.text}`,
      },
    ],
    language,
    createdAt: new Date().toISOString(),
  };

  // Save to database
  await Promise.all([
    db.collection("sessions").doc(sessionId).set(sessionMetadata),
    db.collection("sessionQueues").doc(sessionId).set(sessionQueue),
  ]);

  setTimeout(() => {
    void extendSessionQueue(sessionId);
  }, 3000);

  // Flush traces to LangSmith
  await langsmithClient.awaitPendingTraceBatches();

  return sessionId;
};

export const startSession = traceable(_startSession, {
  name: "start-session",
  client: langsmithClient,
});
