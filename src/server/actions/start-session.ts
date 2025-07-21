"use server";

import { beginSessionPrompt } from "@/prompts";
import db from "@/server/firestore";
import {
  SessionMetadata,
  SessionQueue,
  Song,
  TalkSegment,
  TalkSegmentLanguage,
} from "@/types";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { randomUUID } from "crypto";
import { z } from "zod";
import { extendSessionQueue } from "./extend-session-queue";

export async function startSession(
  seedSong: Song,
  language: TalkSegmentLanguage
): Promise<string> {
  if (!seedSong || !seedSong.id) {
    throw new Error("Valid seedSong is required");
  }

  const sessionId = randomUUID();

  const greetingSegmentId = randomUUID();

  console.log(`[SID:${sessionId.slice(0, 8)}] Generating greeting...`);

  const generatedGreeting = await generateObject({
    model: openai("gpt-4.1-nano"),
    prompt: beginSessionPrompt({
      songTitle: seedSong.title,
      artistName: seedSong.artists[0],
      language,
    }),
    schema: z.object({
      text: z.string().describe("The text of the greeting"),
    }),
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
        reason: "This song was selected by the user.",
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

  return sessionId;
}
